import { db } from '@/lib/db/drizzle';
import { teams, tours } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  uuid: string;
}

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { uuid } = await params;

  try {
    const tourConfig = await db
      .select({
        uuid: tours.uuid,
        title: tours.title,
        description: tours.description,
        steps: tours.steps,
        teamId: teams.id,
        teamName: teams.name,
      })
      .from(tours)
      .innerJoin(teams, eq(tours.teamId, teams.id))
      .where(eq(tours.uuid, uuid))
      .limit(1);

    if (tourConfig.length === 0) {
      return NextResponse.json({ error: 'Tour configuration not found.' }, { status: 404 });
    }

    const response = {
      uuid: tourConfig[0].uuid,
      title: tourConfig[0].title,
      description: tourConfig[0].description,
      steps: JSON.parse(tourConfig[0].steps),
      team: {
        id: tourConfig[0].teamId,
        name: tourConfig[0].teamName,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching tour configuration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
