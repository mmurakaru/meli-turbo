'use client';

import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';
import CTA from './cta';
import Features from './features';

export default function ProductPage() {
  return (
    <main className="bg-gray-50">
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:text-center md:max-w-2xl md:mx-auto lg:col-span-12">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Voice AI Product Tours
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Create engaging product tours with the power of voice AI. Guide your users effortlessly through your
                application.
              </p>
            </div>

            <div className="mt-12 mx-auto max-w-2xl col-span-12 pb-12 sm:pb-16">
              <div className="flex items-center gap-2">
                <Button asChild>
                  <Link href={'/sign-up'}>Sign up for free</Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                >
                  <Link href={'/pricing'}>Compare plans</Link>
                </Button>
              </div>
            </div>

            <div className="py-12 sm:py-16 mx-auto max-w-7xl lg:col-span-12">
              <Features />
            </div>

            <div className="py-12 sm:py-16 mx-auto max-w-7xl lg:col-span-12">
              <CTA />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
