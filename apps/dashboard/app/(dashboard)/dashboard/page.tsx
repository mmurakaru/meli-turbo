import { getAllTours, getTeamForUser, getToursForOwner, getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { Recents } from './recents';
import Loading from './loading';

export default async function RecentsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const team = await getTeamForUser(user.id);

  if (!team) return;

  const tourData = {
    private: await getToursForOwner(user.id, 'user'),
    all: await getAllTours(user.id),
  };

  return (
    <>
      <Loading />
      <Recents tourData={tourData} />
    </>
  );
}
