'use client';

import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="bg-gray-50">
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:text-center md:max-w-2xl md:mx-auto lg:col-span-12">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                The platform for user activation
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Meli provides a interactive product tour that enables teams, to make user onboarding seamless.
              </p>
            </div>

            <div className="mt-12 mx-auto max-w-2xl col-span-12">
              <div className="flex items-center gap-2">
                <Button asChild>
                  <Link href={'/sign-up'}>Sign up for free</Link>
                </Button>
                <Button
                  asChild
                  variant={'outline'}
                >
                  <Link href={'mailto:founders@meli-ai.com'}>Get in touch!</Link>
                </Button>
              </div>
            </div>

            <div className="mt-6 lg:text-center md:max-w-2xl md:mx-auto lg:col-span-12">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight sm:text-3xl md:text-4xl">
                Our mission is to empower teams to onboard users more efficiently
              </h2>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
