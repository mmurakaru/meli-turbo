import { createClient } from '@/utils/supabase/server';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, publicUsers, teamMembers, teams, tours } from './schema';

export async function getUser() {
  const supabase = await createClient();

  const {
    error,
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    return null;
  }

  const publicUser = await db
    .select()
    .from(publicUsers)
    .where(and(eq(publicUsers.id, authUser.id), isNull(publicUsers.deletedAt)))
    .limit(1);

  if (publicUser.length === 0) {
    return null;
  }

  return publicUser[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db.select().from(teams).where(eq(teams.stripeCustomerId, customerId)).limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  },
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: string) {
  const [result] = await db
    .select({
      user: publicUsers,
      teamId: teamMembers.teamId,
    })
    .from(publicUsers)
    .leftJoin(teamMembers, eq(publicUsers.id, teamMembers.userId))
    .where(eq(publicUsers.id, userId))
    .limit(1);

  return result;
}

export async function getActivityLogs() {
  const supabase = await createClient();

  const {
    error,
    data: { user },
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: publicUsers.name,
    })
    .from(activityLogs)
    .leftJoin(publicUsers, eq(activityLogs.userId, publicUsers.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser(userId: string) {
  const result = await db.query.publicUsers.findFirst({
    where: eq(publicUsers.id, userId),
    with: {
      teamMembers: {
        with: {
          team: {
            with: {
              teamMembers: {
                with: {
                  user: {
                    columns: {
                      id: true,
                      email: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return result?.teamMembers[0]?.team || null;
}

// Schema change required
// Add ownerId -> teamId or userId
// Add ownerType -> 'team' or 'user'
export async function getTours(teamId: number) {
  return await db
    .select({
      id: tours.id,
      title: tours.title,
      teamId: tours.teamId,
      description: tours.description,
      createdAt: tours.createdAt,
      updatedAt: tours.updatedAt,
      deletedAt: tours.deletedAt,
    })
    .from(tours)
    .where(eq(tours.teamId, teamId))
    .orderBy(desc(tours.updatedAt))
    .limit(10);
}
