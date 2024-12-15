import { db } from '@/lib/db/drizzle';
import { steps, teams, tours, TourWithSteps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  id: string;
}

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { id } = await params;

  try {
    const tourConfig = await db
      .select({
        id: tours.id,
        title: tours.title,
        description: tours.description,
        teamId: teams.id,
        teamName: teams.name,
        steps: steps,
        createdAt: tours.createdAt,
        updatedAt: tours.updatedAt,
        deletedAt: tours.deletedAt,
      })
      .from(tours)
      .innerJoin(teams, eq(tours.teamId, teams.id))
      .leftJoin(steps, eq(tours.id, steps.tourId))
      .where(eq(tours.id, +id));

    if (tourConfig.length === 0) {
      return NextResponse.json({ error: 'Tour configuration not found.' }, { status: 404 });
    }

    // Group steps by tour
    const groupedSteps = tourConfig.reduce<TourWithSteps | null>((acc, curr) => {
      if (!acc) {
        acc = {
          id: curr.id,
          title: curr.title,
          description: curr.description,
          teamId: curr.teamId,
          createdAt: curr.createdAt,
          updatedAt: curr.updatedAt,
          deletedAt: curr.deletedAt,
          team: {
            id: curr.teamId,
            name: curr.teamName,
          },
          steps: [],
        };
      }
      if (curr.steps) {
        acc?.steps.push({
          id: curr.steps.id,
          tourId: curr.steps.tourId,
          selector: curr.steps.selector,
          title: curr.steps.title,
          text: curr.steps.text,
          order: curr.steps.order,
          createdAt: curr.steps.createdAt,
          updatedAt: curr.steps.updatedAt,
        });
      }
      return acc;
    }, null);

    // Sort steps by order
    groupedSteps?.steps.sort((a, b) => a.order - b.order);

    return NextResponse.json(groupedSteps, { status: 200 });
  } catch (error) {
    console.error('Error fetching tour configuration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
