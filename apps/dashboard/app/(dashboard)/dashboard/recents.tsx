'use client';

import { Card } from '@repo/ui/components/ui/card';
import Link from 'next/link';

export function Recents() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-extrabold mb-6">Recents</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ">
        <div>
          <Link href={'/dashboard/tours/1'}>
            <Card className="max-h-56 aspect-[384/224] bg-gray-50"></Card>
          </Link>
          <div className="py-4">
            <p className="font-bold text-gray-700 text-sm truncate">Untitled Tour</p>
            <div className="flex items-center gap-1">
              <p className="font-normal text-gray-500 text-xs">
                In <b className="text-gradient font-normal">Private</b>
              </p>
              <div className="text-gray-500">&middot;</div>
              <p className="font-normal text-gray-500 text-xs">Updated 6 hours ago</p>
            </div>
          </div>
        </div>
        <div>
          <Link href={'/dashboard/tours/1'}>
            <Card className="max-h-56 aspect-[384/224] bg-gray-50"></Card>
          </Link>
          <div className="py-4">
            <p className="font-bold text-gray-700 text-sm truncate">Untitled Tour</p>
            <div className="flex items-center gap-1">
              <p className="font-normal text-gray-500 text-xs">
                In <b className="text-gradient font-normal">Private</b>
              </p>
              <div className="text-gray-500">&middot;</div>
              <p className="font-normal text-gray-500 text-xs">Updated Oct 2, 2024</p>
            </div>
          </div>
        </div>
        <div>
          <Link href={'/dashboard/tours/1'}>
            <Card className="max-h-56 aspect-[384/224] bg-gray-50"></Card>
          </Link>
          <div className="py-4">
            <p className="font-bold text-gray-700 text-sm truncate">Untitled Tour</p>
            <div className="flex items-center gap-1">
              <p className="font-normal text-gray-500 text-xs">
                In <b className="text-gradient font-normal">Team</b>
              </p>
              <div className="text-gray-500">&middot;</div>
              <p className="font-normal text-gray-500 text-xs">Updated Jul 17, 2024</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
