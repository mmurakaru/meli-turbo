'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser, getUserWithTeam } from '@/lib/db/queries';
import { ActivityType, modules, steps, tours } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { logActivity } from '../(login)/actions';

const createTourSchema = z.object({
  title: z.string().max(100),
  description: z.string(),
  owner: z.string(),
});

export const createTour = validatedActionWithUser(createTourSchema, async (data, _, user) => {
  const { title, description, owner } = data;

  console.log(title);
  console.log(description);
  console.log(owner);
  console.log(user);
});

const updateTourSchema = z.object({
  tourId: z.number(),
  title: z.string().max(100),
  description: z.string(),
});

export const updateTour = validatedActionWithUser(updateTourSchema, async (data, _, user) => {
  const { title, description, tourId } = data;

  console.log(title);
  console.log(description);
  console.log(tourId);
  console.log(user);
});

const createStepSchema = z.object({
  moduleId: z.number(),
  selector: z.string().max(100),
  title: z.string().max(100),
  text: z.string(),
});

export const createStep = validatedActionWithUser(createStepSchema, async (data, _, user) => {
  const { moduleId, selector, title, text } = data;

  const [module] = await db.select({ tourId: modules.tourId }).from(modules).where(eq(modules.id, moduleId)).limit(1);

  if (!module) {
    return { error: 'Module not found' };
  }

  const [tour] = await db.select({ teamId: tours.ownerId }).from(tours).where(eq(tours.id, module.tourId)).limit(1);

  if (!tour) {
    return { error: 'Tour not found' };
  }

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

  await logActivity(tour.teamId, user.id, ActivityType.CREATE_STEP);

  return { success: 'Step created successfully', step: newStep };
});

export const getTeam = async (userId: string) => {
  return getTeamForUser(userId);
};
