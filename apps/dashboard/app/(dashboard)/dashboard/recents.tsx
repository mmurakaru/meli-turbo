'use client';

import { Button } from '@repo/ui/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import Link from 'next/link';

export function Recents() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-extrabold mb-6">Recents</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-gradient">Tour 1</CardTitle>
            <CardDescription>Tour 1 description.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              className="w-full"
              asChild
              variant={'outline'}
            >
              <Link href={'/dashboard/tours/1'}>Edit tour</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-gradient">Tour 2</CardTitle>
            <CardDescription>Tour 2 description.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              className="w-full"
              asChild
              variant={'outline'}
            >
              <Link href={'/dashboard/tours/2'}>Edit tour</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-gradient">Tour 3</CardTitle>
            <CardDescription>Tour 3 description.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              className="w-full"
              asChild
              variant={'outline'}
            >
              <Link href={'/dashboard/tours/3'}>Edit tour</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-gradient">Tour 4</CardTitle>
            <CardDescription>Tour 4 description.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              className="w-full"
              asChild
              variant={'outline'}
            >
              <Link href={'/dashboard/tours/4'}>Edit tour</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-gradient">Tour 5</CardTitle>
            <CardDescription>Tour 5 description.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              className="w-full"
              asChild
              variant={'outline'}
            >
              <Link href={'/dashboard/tours/5'}>Edit tour</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
