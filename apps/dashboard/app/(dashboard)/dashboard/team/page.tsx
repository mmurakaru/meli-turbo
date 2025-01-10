import { getTeamForUser, getToursForOwner, getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { Team } from './team';

export default async function TeamPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const team = await getTeamForUser(user.id);

  if (!team) {
    redirect('/sign-in');
  }

  const tourData = await getToursForOwner(team.id, 'team');

  return <Team tourData={tourData} />;
}
