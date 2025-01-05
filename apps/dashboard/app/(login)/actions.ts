'use server';

import { validatedAction, validatedActionWithUser } from '@/lib/auth/middleware';
import { db } from '@/lib/db/drizzle';
import { getUserWithTeam } from '@/lib/db/queries';
import {
  activityLogs,
  ActivityType,
  invitations,
  modules,
  type NewActivityLog,
  type NewTeam,
  type NewTeamMember,
  type NewUser,
  publicUsers,
  steps,
  teamMembers,
  teams,
  tours,
} from '@/lib/db/schema';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { createClient } from '@/utils/supabase/server';
import { and, eq, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export async function logActivity(
  teamId: string | null | undefined,
  userId: string,
  type: ActivityType,
  ipAddress?: string,
) {
  if (teamId === null || teamId === undefined) {
    return;
  }
  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action: type,
    ipAddress: ipAddress || '',
  };
  await db.insert(activityLogs).values(newActivity);
}

export async function signInWithOAuth(inviteId?: string | null) {
  const supabase = await createClient();
  const provider = 'google';
  const origin = (await headers()).get('origin');

  const { error, data } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        ...(inviteId && { inviteId }),
      },
    },
  });

  if (error) {
    return { error: 'Failed to initiate Google sign-in. Please try again.' };
  }

  if (data.url) {
    redirect(data.url);
  }
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const supabase = await createClient();

  const { error, data: authData } = await supabase.auth.signInWithPassword(data);

  if (error) {
    const code = error.code;

    switch (code) {
      case 'email_not_confirmed':
        return { error: 'To sign in, please confirm your email.' };
      default:
        return { error: 'Invalid email or password. Please try again.' };
    }
  }

  if (!authData.user) {
    return { error: 'User not found. Please try again.' };
  }

  const userWithTeam = await db
    .select({
      user: publicUsers,
      team: teams,
    })
    .from(publicUsers)
    .leftJoin(teamMembers, eq(publicUsers.id, teamMembers.userId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(publicUsers.id, authData.user.id))
    .limit(1);

  if (!userWithTeam.length) {
    return { error: 'User data not found. Please contact support.' };
  }

  const { user: foundUser, team: foundTeam } = userWithTeam[0];

  await Promise.all([logActivity(foundTeam?.id, foundUser.id, ActivityType.SIGN_IN)]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ team: foundTeam, priceId });
  }

  redirect('/dashboard');
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteId: z.string().optional(),
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const supabase = await createClient();
  const { email, password, inviteId } = data;

  const existingUser = await db.select().from(publicUsers).where(eq(publicUsers.email, email)).limit(1);

  if (existingUser.length) {
    return { error: 'An account with this email already exists. Please sign in.' };
  }

  const { error, data: authData } = await supabase.auth.signUp({ email, password });

  if (error || !authData.user) {
    return { error: 'Failed to create user. Please try again.' };
  }

  const newUser: NewUser = {
    id: authData.user.id,
    email: authData.user.email!,
    role: 'owner', // Default role, will be overridden if there's an invitation
  };

  const [createdUser] = await db.insert(publicUsers).values(newUser).returning();

  if (!createdUser) {
    return { error: 'Failed to create user profile. Please try again.' };
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
        and(eq(invitations.id, parseInt(inviteId)), eq(invitations.email, email), eq(invitations.status, 'pending')),
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
      name: `${email}'s Team`,
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
    teamId: teamId,
    role: userRole,
  };

  await Promise.all([
    db.insert(teamMembers).values(newTeamMember),
    logActivity(teamId, createdUser.id, ActivityType.SIGN_UP),
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ team: createdTeam, priceId });
  }

  redirect('/sign-in');
});

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: 'Failed to sign out user.' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const userWithTeam = await getUserWithTeam(user.id);
    if (userWithTeam) {
      await logActivity(userWithTeam.teamId, user.id, ActivityType.SIGN_OUT);
    }
  }
}

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(8).max(100),
    newPassword: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const updatePassword = validatedActionWithUser(updatePasswordSchema, async (data, _, user) => {
  const supabase = await createClient();
  const { currentPassword, newPassword } = data;

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (signInError) {
    return { error: 'Current password is incorrect.' };
  }

  if (currentPassword === newPassword) {
    return {
      error: 'New password must be different from the current password.',
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { error: 'Failed to update password. Please try again.' };
  }

  const userWithTeam = await getUserWithTeam(user.id);

  await logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_PASSWORD);

  return { success: 'Password updated successfully.' };
});

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

export const deleteAccount = validatedActionWithUser(deleteAccountSchema, async (data, _, user) => {
  const supabase = await createClient();
  const { password } = data;

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: password,
  });

  if (signInError) {
    return { error: 'Incorrect password. Account deletion failed.' };
  }

  const userWithTeam = await getUserWithTeam(user.id);

  await logActivity(userWithTeam?.teamId, user.id, ActivityType.DELETE_ACCOUNT);

  // Soft delete
  await db
    .update(publicUsers)
    .set({
      deletedAt: sql`CURRENT_TIMESTAMP`,
      name: sql`CONCAT(name, '-', id, '-deleted')`, // Ensure name uniqueness
      email: sql`CONCAT(email, '-', id, '-deleted')`, // Ensure email uniqueness
    })
    .where(eq(publicUsers.id, user.id));

  if (userWithTeam?.teamId) {
    await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, userWithTeam.teamId)));
  }

  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return { error: 'Failed to delete account. Please contact support.' };
  }

  await supabase.auth.signOut();

  redirect('/sign-in');
});

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
});

export const updateAccount = validatedActionWithUser(updateAccountSchema, async (data, _, user) => {
  const supabase = await createClient();
  const { name, email } = data;
  const userWithTeam = await getUserWithTeam(user.id);

  if (email !== user.email) {
    const { error: updateAuthError } = await supabase.auth.updateUser({ email: email });
    if (updateAuthError) {
      return { error: 'Failed to update email. Please try again.' };
    }
  }

  await Promise.all([
    db.update(publicUsers).set({ name, email }).where(eq(publicUsers.id, user.id)),
    logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_ACCOUNT),
  ]);

  return { success: 'Account updated successfully.' };
});

const removeTeamMemberSchema = z.object({
  memberId: z.number(),
});

export const removeTeamMember = validatedActionWithUser(removeTeamMemberSchema, async (data, _, user) => {
  const { memberId } = data;
  const userWithTeam = await getUserWithTeam(user.id);

  if (!userWithTeam?.teamId) {
    return { error: 'User is not part of a team' };
  }

  await db.delete(teamMembers).where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, userWithTeam.teamId)));

  await logActivity(userWithTeam.teamId, user.id, ActivityType.REMOVE_TEAM_MEMBER);

  return { success: 'Team member removed successfully' };
});

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'owner']),
});

export const inviteTeamMember = validatedActionWithUser(inviteTeamMemberSchema, async (data, _, user) => {
  const { email, role } = data;
  const userWithTeam = await getUserWithTeam(user.id);

  if (!userWithTeam?.teamId) {
    return { error: 'User is not part of a team' };
  }

  const existingMember = await db
    .select()
    .from(publicUsers)
    .leftJoin(teamMembers, eq(publicUsers.id, teamMembers.userId))
    .where(and(eq(publicUsers.email, email), eq(teamMembers.teamId, userWithTeam.teamId)))
    .limit(1);

  if (existingMember.length > 0) {
    return { error: 'User is already a member of this team' };
  }

  // Check if there's an existing invitation
  const existingInvitation = await db
    .select()
    .from(invitations)
    .where(
      and(eq(invitations.email, email), eq(invitations.teamId, userWithTeam.teamId), eq(invitations.status, 'pending')),
    )
    .limit(1);

  if (existingInvitation.length > 0) {
    return { error: 'An invitation has already been sent to this email' };
  }

  // Create a new invitation
  await db.insert(invitations).values({
    teamId: userWithTeam.teamId,
    email,
    role,
    invitedBy: user.id,
    status: 'pending',
  });

  await logActivity(userWithTeam.teamId, user.id, ActivityType.INVITE_TEAM_MEMBER);

  // TODO: Send invitation email and include ?inviteId={id} to sign-up URL
  // await sendInvitationEmail(email, userWithTeam.team.name, role)

  return { success: 'Invitation sent successfully' };
});

const createStepSchema = z.object({
  moduleId: z.number(),
  selector: z.string().max(100),
  title: z.string().max(100),
  text: z.string(),
});

export const createStep = validatedActionWithUser(createStepSchema, async (data, _, user) => {
  const { moduleId, selector, title, text } = data;

  // Fetch the module to get the associated tour
  const [module] = await db.select({ tourId: modules.tourId }).from(modules).where(eq(modules.id, moduleId)).limit(1);

  if (!module) {
    return { error: 'Module not found' };
  }

  // Fetch the tour to get the team ID
  const [tour] = await db.select({ teamId: tours.ownerId }).from(tours).where(eq(tours.id, module.tourId)).limit(1);

  if (!tour) {
    return { error: 'Tour not found' };
  }

  // Check if the user is a member of the team
  const userWithTeam = await getUserWithTeam(user.id);
  if (!userWithTeam || userWithTeam.teamId !== tour.teamId) {
    return { error: 'User is not authorized to create steps for this tour' };
  }

  // Get the highest order number for steps in the module
  const [highestOrder] = await db
    .select({ maxOrder: sql<number>`MAX(${steps.order})` })
    .from(steps)
    .where(eq(steps.moduleId, moduleId));

  const nextOrder = (highestOrder?.maxOrder || 0) + 1;

  // Create the new step
  const [newStep] = await db
    .insert(steps)
    .values({
      moduleId,
      selector,
      title,
      text,
      order: nextOrder,
    })
    .returning();

  if (!newStep) {
    return { error: 'Failed to create step. Please try again.' };
  }

  // Log the activity
  await logActivity(tour.teamId, user.id, ActivityType.CREATE_STEP);

  return { success: 'Step created successfully', step: newStep };
});
