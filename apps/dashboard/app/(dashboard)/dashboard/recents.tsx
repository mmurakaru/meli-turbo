'use client';

import { Tour } from '@/lib/db/schema';
import { Card } from '@workspace/ui/components/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { SquarePlus } from 'lucide-react';
import Link from 'next/link';
import { normalizedTours } from '../helper/normalize-tour.helper';

export function Recents({ tourData }: { tourData: { private: Tour[]; all: Tour[] } }) {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-extrabold mb-6">Recents</h1>

      <Link href="/dashboard/new-tour">
        <Card className="max-w-64 flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors mb-6">
          <SquarePlus className="text-violet-700 stroke-1" />
          <div>
            <p className="font-bold text-gray-700 text-sm truncate">Create new tour</p>
            <p className="font-normal text-gray-500 text-xs truncate">Start from blank</p>
          </div>
        </Card>
      </Link>

      <Tabs defaultValue="private">
        <TabsList className="w-[200px] grid grid-cols-2">
          <TabsTrigger value="private">Private</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent
          value="private"
          className="mt-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ">
            {normalizedTours(tourData.private).map((tour) => (
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
        </TabsContent>

        <TabsContent
          value="all"
          className="mt-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ">
            {normalizedTours(tourData.all).map((tour) => (
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
        </TabsContent>
      </Tabs>
    </section>
  );
}
