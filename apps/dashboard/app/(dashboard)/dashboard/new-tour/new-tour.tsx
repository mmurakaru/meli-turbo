'use client';

import { rectSortingStrategy } from '@dnd-kit/sortable';

import { useIsMobile } from '@workspace/ui/hooks/use-mobile';
import { MultipleContainers } from './multiple-containers';

export function NewTour() {
  const isMobile = useIsMobile();
  return (
    <section>
      <h1 className="text-lg lg:text-2xl font-extrabold mb-6">Create new tour</h1>
      <p>Each tour consists of many modules with multiple steps. Create modules and move steps between modules.</p>
      <div className="w-full overflow-auto">
        <MultipleContainers
          columns={1}
          itemCount={5}
          strategy={rectSortingStrategy}
          vertical={isMobile}
          trashable
        />
      </div>
    </section>
  );
}
