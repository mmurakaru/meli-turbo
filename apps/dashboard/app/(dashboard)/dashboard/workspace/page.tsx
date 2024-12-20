import { getTeamForUser, getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { Settings } from './settings';

export default async function WorkspacePage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const teamData = await getTeamForUser(user.id);

  if (!teamData) {
    throw new Error('Team not found');
  }

  return <Settings teamData={teamData} />;
}
