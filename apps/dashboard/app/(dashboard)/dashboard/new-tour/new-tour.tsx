'use client';

import { rectSortingStrategy } from '@dnd-kit/sortable';

import { useIsMobile } from '@workspace/ui/hooks/use-mobile';
import { MultipleContainers } from './multiple-containers';

import { cn } from '@workspace/ui/lib/utils';
import styles from './new-tour.module.scss';

export function NewTour() {
  const isMobile = useIsMobile();
  return (
    <section>
      <h1 className="text-lg lg:text-2xl font-extrabold mb-2">Create new tour</h1>
      <p className="mb-4">
        Each tour consists of modules with multiple steps. Create modules and move steps between modules.
      </p>
      <div className={cn(styles.Scrollable, 'w-full overflow-auto')}>
        <MultipleContainers
          columns={1}
          itemCount={3}
          strategy={rectSortingStrategy}
          vertical={isMobile}
          trashable
        />
        <div className="scrollable-mask--start"></div>
        <div className="scrollable-mask--end"></div>
      </div>
    </section>
  );
}
