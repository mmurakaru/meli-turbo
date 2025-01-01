'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@workspace/ui/components/accordion';
import { Button } from '@workspace/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function VoiceWave() {
  const [amplitude, setAmplitude] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAmplitude((prev) => (prev + 1) % 5);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center items-center bg-white">
      <div className="relative flex items-center justify-center gap-1.5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="rounded-full 
              transition-all 
              duration-300 
              ease-in-out 
              bg-gradient-to-b 
              from-gray-50
              to-purple-500
              shadow-md"
            style={{
              width: '5px',
              height: `${10 + (i === amplitude ? 20 : 0)}px`,
              opacity: 0.4 + i * 0.1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="bg-gray-50">
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:text-center md:max-w-2xl md:mx-auto lg:col-span-12">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Transform Your User Onboarding Experience
                <span className="bg-gradient-to-r from-[#2d3af7] to-[#c90add] text-transparent bg-clip-text inline-block sm:leading-[3.75rem] md:leading-[4.5rem]">
                  with Voice AI
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Build and Launch interactive product tours in record time. Define tour steps and let Voice AI guide the
                user through core features.
              </p>
            </div>

            <div className="mt-12 mx-auto max-w-2xl col-span-12">
              <div className="flex items-center gap-2">
                <Button asChild>
                  <Link href={'/sign-up'}>Sign up for free</Link>
                </Button>
                <Popover>
                  <PopoverTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-normal transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                    Get a demo
                  </PopoverTrigger>
                  <PopoverContent
                    sideOffset={10}
                    side="bottom"
                    className="bg-white flex flex-col gap-8 shadow-md max-w-80"
                  >
                    <div className="flex flex-col gap-4">
                      <p className="font-bold text-sm leading-5 text-gray-900">AI-Powered Product Tours!</p>
                      <p className="text-sm leading-5 text-gray-500">
                        Revolutionize your user onboarding with our AI voice agent. Create interactive, voice-guided
                        tours that engage users and showcase your SaaS product's best features. <br /> <br /> Boost
                        adoption rates and user satisfaction in minutes, not days.
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <VoiceWave />
                      <Button asChild>
                        <Link href="/sign-up">Create a tour</Link>
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="py-12 sm:py-16 mx-auto max-w-7xl lg:col-span-12">
              <h2 className="text-base sm:text-xl lg:text-lg xl:text-xl tracking-tight text-center text-gray-900">
                Trusted by
              </h2>
              <div className="mx-auto mt-8 grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5">
                <Image
                  className="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
                  src="logoipsum_1.svg"
                  alt="Logoipsum"
                  width="158"
                  height="48"
                />
                <Image
                  className="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
                  src="logoipsum_2.svg"
                  alt="Logoipsum"
                  width="158"
                  height="48"
                />
                <Image
                  className="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
                  src="logoipsum_3.svg"
                  alt="Logoipsum"
                  width="158"
                  height="48"
                />
                <Image
                  className="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
                  src="logoipsum_4.svg"
                  alt="Logoipsum"
                  width="158"
                  height="48"
                />
                <Image
                  className="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
                  src="logoipsum_5.svg"
                  alt="Logoipsum"
                  width="158"
                  height="48"
                />
              </div>
            </div>
            <div className="py-12 sm:py-16 max-w-7xl lg:col-span-12">
              <h2 className="font-bold text-base sm:text-xl lg:text-lg xl:text-xl tracking-tight text-gray-900">
                FAQ's
              </h2>
              <Accordion
                type="single"
                collapsible
                className="w-full"
              >
                <AccordionItem value="item-1">
                  <AccordionTrigger>Are tooltips accessible?</AccordionTrigger>
                  <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Are tooltips styled & branded?</AccordionTrigger>
                  <AccordionContent>
                    Yes. Tooltips come with default styles and Meli branding, but you can get unbranded tooltips when
                    choosing our Base or Pro plan.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Are tour steps animated?</AccordionTrigger>
                  <AccordionContent>Yes. The tour steps are animated by default.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Is a developer needed to implement a product tour?</AccordionTrigger>
                  <AccordionContent>
                    Yes. Setting up the product tour rendering requires developer intervention. Creating the tour itself
                    can be done no-code.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
