import { getTeamForUser, getTours, getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { Recents } from './recents';

export default async function RecentsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const team = await getTeamForUser(user.id);

  if (!team) return;

  const tourData = await getTours(team.id);

  return <Recents tourData={tourData} />;
}
