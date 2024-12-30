import { Terminal } from '@/app/(dashboard)/terminal';
import { getTeamForUser, getTour, getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export default async function TourPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;

  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const tour = await getTour(Number(slug), user.id);
  if (!tour) {
    redirect('/not-found');
  }

  const userTeam = await getTeamForUser(user.id);

  const hasPermission =
    (tour.ownerId === user.id && tour.ownerType === 'user') ||
    (tour.ownerId === userTeam?.id && tour.ownerType === 'team');

  if (!hasPermission) {
    redirect('/not-found');
  }
  return (
    <section className="flex-1">
      <h1 className="text-lg lg:text-2xl font-extrabold mb-6">Edit Tour {slug}</h1>

      <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:col-start-4 lg:flex lg:items-center">
        <Terminal tourId={slug} />
      </div>
    </section>
  );
}
