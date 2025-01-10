import { Skeleton } from '@workspace/ui/components/skeleton';

export default function Loading() {
  return (
    <section className="flex-1">
      <div className="flex items-center space-x-4">
        <div className="space-y-2">
          {/* Recents Text */}
          <Skeleton className="h-4 w-[250px] mb-6" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </section>
  );
}
