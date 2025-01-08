'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import { z } from 'zod';

const createTourSchema = z.object({
  tourId: z.number(),
  title: z.string().max(100),
  description: z.string(),
});

export const updateTour = validatedActionWithUser(createTourSchema, async (data, _, user) => {
  const { title, description, tourId } = data;

  console.log(title);
  console.log(description);
  console.log(tourId);
  console.log(user);
});
