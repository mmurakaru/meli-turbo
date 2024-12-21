import { logActivity } from '@/app/(login)/actions';
import { hashPassword, setSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { ActivityType, teamMembers, teams, users } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const generateRandomPasswordHash = async () => {
  const randomBytes = crypto.randomBytes(32);
  return await hashPassword(randomBytes.toString('hex'));
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { email, user_metadata } = data.user;

      if (!email) return;

      const userWithTeam = await db
        .select({
          user: users,
          team: teams,
        })
        .from(users)
        .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
        .leftJoin(teams, eq(teamMembers.teamId, teams.id))
        .where(eq(users.email, email))
        .limit(1);

      if (userWithTeam.length === 0) {
        // User doesn't exist, create new user and team
        const passwordHash = await generateRandomPasswordHash();
        const [createdUser] = await db
          .insert(users)
          .values({
            email,
            passwordHash,
            name: user_metadata.full_name,
            role: 'owner',
          })
          .returning();

        const [createdTeam] = await db
          .insert(teams)
          .values({
            name: `${email}'s Team`,
          })
          .returning();

        await db.insert(teamMembers).values({
          userId: createdUser.id,
          teamId: createdTeam.id,
          role: 'owner',
        });

        await Promise.all([
          setSession(createdUser),
          logActivity(createdTeam.id, createdUser.id, ActivityType.SIGN_UP),
          logActivity(createdTeam.id, createdUser.id, ActivityType.CREATE_TEAM),
        ]);
      } else {
        // User exists, just set the session
        const { user: existingUser, team: existingTeam } = userWithTeam[0];
        await Promise.all([
          setSession(existingUser),
          logActivity(existingTeam?.id, existingUser.id, ActivityType.SIGN_IN),
        ]);
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/error`);
}
