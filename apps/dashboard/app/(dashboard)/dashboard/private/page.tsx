import { getTeamForUser, getTours, getUser } from '@/lib/db/queries';
import { Private } from './private';

export default async function PrivatePage() {
  const user = await getUser();

  if (!user) return;

  const team = await getTeamForUser(user.id);

  if (!team) return;

  const tourData = await getTours(team.id);

  return <Private tourData={tourData} />;
}
