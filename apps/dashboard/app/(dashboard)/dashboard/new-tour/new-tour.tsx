'use client';

import { rectSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@workspace/ui/lib/utils';
import { MultipleContainers } from '../../components/board/multiple-containers/multiple-containers';
import styles from '../../components/board/multiple-containers/multiple-containers.module.scss';

export function NewTour() {
  return (
    <section>
      <h1 className="text-lg lg:text-2xl font-extrabold mb-2">Create new tour</h1>
      <p className="mb-4">
        Each tour consists of modules with multiple steps. Create modules and move steps between modules.
      </p>

      <div className={cn(styles.scrollableWrapper)}>
        <div className={cn(styles.scrollable)}>
          <MultipleContainers
            columns={1}
            itemCount={3}
            strategy={rectSortingStrategy}
            trashable
            handle
          />
        </div>
        <div className={styles.scrollableMaskStart}></div>
        <div className={styles.scrollableMaskEnd}></div>
      </div>
    </section>
  );
}
