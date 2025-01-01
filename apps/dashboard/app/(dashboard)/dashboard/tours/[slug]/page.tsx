import { getTeamForUser, getTour, getUser } from '@/lib/db/queries';
import { cn } from '@workspace/ui/lib/utils';
import { redirect } from 'next/navigation';
import { MultipleContainers } from '../../../components/board/multiple-containers/multiple-containers';
import styles from '../../../components/board/multiple-containers/multiple-containers.module.scss';

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
    <section>
      <h1 className="text-lg lg:text-2xl font-extrabold mb-2">Edit Tour {slug}</h1>
      <p className="mb-4">
        Each tour consists of modules with multiple steps. Create modules and move steps between modules.
      </p>

      <div className={cn(styles.scrollableWrapper)}>
        <div className={cn(styles.scrollable)}>
          <MultipleContainers
            columns={1}
            itemCount={3}
            trashable
          />
        </div>
        <div className={styles.scrollableMaskStart}></div>
        <div className={styles.scrollableMaskEnd}></div>
      </div>
    </section>
  );
}
