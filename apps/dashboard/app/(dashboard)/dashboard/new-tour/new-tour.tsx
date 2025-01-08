'use client';

// import { rectSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@workspace/ui/components/button';
// import { cn } from '@workspace/ui/lib/utils';
// import { MultipleContainers } from '../../components/board/multiple-containers/multiple-containers';
// import styles from '../../components/board/multiple-containers/multiple-containers.module.scss';

export function NewTour() {
  return (
    <section className="h-full">
      <div className="h-full grid place-items-center">
        <div>
          <h1 className="text-lg lg:text-2xl font-extrabold mb-2">Create new tour</h1>
          <p className="mb-4 text-sm">
            Each tour consists of modules with multiple steps. <br /> Think of modules as building blocks of your tour.{' '}
            <br />
            Get started by adding a module.
          </p>
          <Button size="sm">Create Module</Button>
        </div>
      </div>

      {/* <div className={cn(styles.scrollableWrapper)}>
        <div className={cn(styles.scrollable)}>
          <MultipleContainers
            itemCount={3}
            strategy={rectSortingStrategy}
            trashable
            handle
          />
        </div>
        <div className={styles.scrollableMaskStart}></div>
        <div className={styles.scrollableMaskEnd}></div>
      </div> */}
    </section>
  );
}
