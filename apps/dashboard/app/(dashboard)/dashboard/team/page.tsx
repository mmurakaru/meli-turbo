import { getTeamForUser, getToursForOwner, getUser } from '@/lib/db/queries';
import { Team } from './team';

export default async function TeamPage() {
  const user = await getUser();

  if (!user) return;

  const team = await getTeamForUser(user.id);

  if (!team) return;

  const tourData = await getToursForOwner(team.id, 'team');

  return <Team tourData={tourData} />;
}
