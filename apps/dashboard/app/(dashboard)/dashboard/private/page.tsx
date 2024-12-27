import { getTeamForUser, getToursForOwner, getUser } from '@/lib/db/queries';
import { Private } from './private';

export default async function PrivatePage() {
  const user = await getUser();

  if (!user) return;

  const team = await getTeamForUser(user.id);

  if (!team) return;

  const tourData = await getToursForOwner(user.id, 'user');

  return <Private tourData={tourData} />;
}
