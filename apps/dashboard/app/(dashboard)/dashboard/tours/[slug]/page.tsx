import { getTeamForUser, getTour, getUser } from '@/lib/db/queries';
import { cn } from '@workspace/ui/lib/utils';
import { redirect } from 'next/navigation';
import { MultipleContainers } from '../../../_components/board/multiple-containers/multiple-containers';
import styles from '../../../_components/board/multiple-containers/multiple-containers.module.scss';
import { TourHeader } from './tour-header';

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
      <TourHeader
        tourId={tour.id}
        description={tour.description}
        title={tour.title}
      />
      <div className={cn(styles.scrollableWrapper)}>
        <div className={cn(styles.scrollable)}>
          <MultipleContainers
            trashable
            handle
            tourId={tour.id}
          />
        </div>
        <div className={styles.scrollableMaskStart}></div>
        <div className={styles.scrollableMaskEnd}></div>
      </div>
    </section>
  );
}
