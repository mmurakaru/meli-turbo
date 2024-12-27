import { logActivity } from '@/app/(login)/actions';
import { db } from '@/lib/db/drizzle';
import {
  ActivityType,
  invitations,
  NewTeam,
  NewTeamMember,
  NewUser,
  publicUsers,
  teamMembers,
  teams,
} from '@/lib/db/schema';
import { createClient } from '@/utils/supabase/server';
import { User } from '@supabase/supabase-js';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard';
  const inviteId = searchParams.get('inviteId');

  if (code) {
    const supabase = await createClient();
    const {
      error,
      data: { user },
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !user) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    // Check if the user already exists in publicUsers
    const existingUser = await db.select().from(publicUsers).where(eq(publicUsers.email, user.email!)).limit(1);

    if (existingUser.length) {
      await handleSignIn(user, origin);
    } else {
      await handleSignUp(user, inviteId, origin);
    }

    // Handle redirection based on environment and forwarded host
    const forwardedHost = request.headers.get('x-forwarded-host'); // Original origin before load balancer
    const isLocalEnv = process.env.NODE_ENV === 'development';

    if (isLocalEnv) {
      // No load balancer in local development
      return NextResponse.redirect(`${origin}${next}`);
    } else if (forwardedHost) {
      // Use forwarded host in production behind a load balancer
      return NextResponse.redirect(`https://${forwardedHost}${next}`);
    } else {
      // Fallback to origin if no forwarded host is available
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redirect to error page if no code is provided
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

async function handleSignIn(user: User, origin: string) {
  const userWithTeam = await db
    .select({
      user: publicUsers,
      team: teams,
    })
    .from(publicUsers)
    .leftJoin(teamMembers, eq(publicUsers.id, teamMembers.userId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(publicUsers.id, user.id))
    .limit(1);

  if (!userWithTeam.length) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const { user: foundUser, team: foundTeam } = userWithTeam[0];

  await Promise.all([logActivity(foundTeam?.id, foundUser.id, ActivityType.SIGN_IN)]);
}

async function handleSignUp(user: User, inviteId: string | null, origin: string) {
  const newUser: NewUser = {
    id: user.id,
    email: `${user.email}`,
    role: 'owner', // Default role, will be overridden if there's an invitation
  };

  const [createdUser] = await db.insert(publicUsers).values(newUser).returning();

  if (!createdUser) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  let teamId: string;
  let userRole: string;
  let createdTeam: typeof teams.$inferSelect | null = null;

  if (inviteId) {
    // Check if there's a valid invitation
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.id, parseInt(inviteId)),
          eq(invitations.email, `${user.email}`),
          eq(invitations.status, 'pending'),
        ),
      )
      .limit(1);

    if (invitation) {
      teamId = invitation.teamId;
      userRole = invitation.role;

      await db.update(invitations).set({ status: 'accepted' }).where(eq(invitations.id, invitation.id));
      await db.update(publicUsers).set({ role: userRole }).where(eq(publicUsers.id, createdUser.id));

      await logActivity(teamId, createdUser.id, ActivityType.ACCEPT_INVITATION);

      [createdTeam] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
    } else {
      return { error: 'Invalid or expired invitation.' };
    }
  } else {
    // Create a new team if there's no invitation
    const newTeam: NewTeam = {
      name: `${user.email}'s Team`,
    };

    [createdTeam] = await db.insert(teams).values(newTeam).returning();

    if (!createdTeam) {
      return { error: 'Failed to create team. Please try again.' };
    }

    teamId = createdTeam.id;
    userRole = 'owner';

    await logActivity(teamId, createdUser.id, ActivityType.CREATE_TEAM);
  }

  const newTeamMember: NewTeamMember = {
    userId: createdUser.id,
    teamId,
    role: userRole,
  };

  await Promise.all([
    db.insert(teamMembers).values(newTeamMember),
    logActivity(teamId, createdUser.id, ActivityType.SIGN_UP),
  ]);
}
