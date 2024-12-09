import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { Recents } from './recents';

export default async function RecentsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return <Recents />;
}
