'use client';

import { Tour } from '@/lib/db/schema';
import { Card } from '@workspace/ui/components/card';
import Link from 'next/link';
import { NewTourLink } from '../../components/new-tour-link';
import { normalizedTours } from '../../helper/normalize-tour.helper';

export function Private({ tourData }: { tourData: Tour[] }) {
  return (
    <section className="flex-1">
      <h1 className="text-lg lg:text-2xl font-extrabold mb-6">Private</h1>
      <NewTourLink />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ">
        {normalizedTours(tourData).map((tour) => (
          <div key={tour.id}>
            <Link href={`/dashboard/tours/${tour.id}`}>
              <Card className="max-h-56 aspect-[384/224] bg-gray-50"></Card>
            </Link>
            <div className="py-4">
              <p className="font-bold text-gray-700 text-sm truncate">{tour.title}</p>
              <div className="flex items-center gap-1">
                <p className="font-normal text-gray-500 text-xs">
                  In <b className="text-gradient font-normal">{tour.ownerType}</b>
                </p>
                <div className="text-gray-500">&middot;</div>
                <p className="font-normal text-gray-500 text-xs">Updated {tour.updatedAt}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
