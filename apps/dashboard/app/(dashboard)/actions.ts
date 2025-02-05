'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser, getUserWithTeam } from '@/lib/db/queries';
import { ActivityType, modules, steps, tours } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { logActivity } from '../(login)/actions';

const createTourSchema = z.object({
  title: z.string().max(100),
  description: z.string(),
  owner: z.string(),
});

export const createTour = validatedActionWithUser(createTourSchema, async (data, _, user) => {
  const { title, description, owner } = data;

  const team = await getTeam(user.id);

  if (!team) {
    return { error: 'User is not authorized to create tour' };
  }

  const ownerId = owner === 'team' ? team.id : user.id;
  const ownerType = owner === 'team' ? 'team' : 'user';

  const [newTour] = await db
    .insert(tours)
    .values({
      title,
      description,
      ownerType: ownerType,
      ownerId: ownerId,
    })
    .returning();

  if (!newTour) {
    return { error: 'Failed to create Tour. Please try again.' };
  }

  await logActivity(team.id, user.id, ActivityType.CREATE_TOUR);

  redirect(`/dashboard/tours/${newTour.id}`);
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

const createModuleSchema = z.object({
  tourId: z.coerce.number(),
  title: z.string().max(100),
});

export const createModule = validatedActionWithUser(createModuleSchema, async (data, _, user) => {
  const { tourId, title } = data;

  const [tour] = await db.select({ ownerId: tours.ownerId }).from(tours).where(eq(tours.id, tourId)).limit(1);

  console.log(tour);

  if (!tour) {
    return { error: 'Tour not found' };
  }

  const userWithTeam = await getUserWithTeam(user.id);

  if (!userWithTeam || (userWithTeam.teamId !== tour.ownerId && user.id !== tour.ownerId)) {
    return { error: 'User is not authorized to create modules for this tour' };
  }

  const [highestOrder] = await db.select({ maxOrder: sql<number>`MAX(${modules.order})` }).from(modules);

  const nextOrder = (highestOrder?.maxOrder || 0) + 1;

  const [newModule] = await db
    .insert(modules)
    .values({
      tourId,
      title,
      order: nextOrder,
    })
    .returning();

  if (!newModule) {
    return { error: 'Failed to create module. Please try again.' };
  }

  await logActivity(userWithTeam.teamId, user.id, ActivityType.CREATE_MODULE);

  return { success: 'Module created successfully', step: newModule };
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

  await logActivity(userWithTeam.teamId, user.id, ActivityType.CREATE_STEP);

  return { success: 'Step created successfully', step: newStep };
});

export const getTeam = async (userId: string) => {
  return getTeamForUser(userId);
};
