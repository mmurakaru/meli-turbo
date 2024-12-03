'use client';

import { Button } from '@repo/ui/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/ui/popover';
import Vapi from '@vapi-ai/web';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { create } from '../actions';

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
  const [assistantId, setAssistantId] = useState();
  const publicVapiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

  if (!publicVapiKey) {
    throw new Error('NEXT_PUBLIC_VAPI_PUBLIC_KEY is not defined.');
  }

  const vapi = new Vapi(publicVapiKey);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function startAssistance() {
    await vapi.start(assistantId);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function stopAssistance() {
    await vapi.stop();
  }

  useEffect(() => {
    create().then((data) => setAssistantId(data.id));
  }, []);

  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-12">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Transform Your User Onboarding Experience
                <span className="block text-purple-500">with Voice AI</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Launch your SaaS product tour in record time with our powerful voice agent. Create tours and let Voice
                AI guide the user.
              </p>
            </div>

            <div className="flex flex-col gap-2 mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:col-start-4 lg:flex lg:items-center">
              <Popover>
                <PopoverTrigger>
                  <p className="w-fit text-slate-50 font-medium text-sm py-2 px-4 bg-[hsl(222.2,47.4%,11.2%)] rounded-[calc(0.5rem-2px)] whitespace-nowrap h-9 gap-2 justify-center inline-flex items-center">
                    Give it a try!
                  </p>
                </PopoverTrigger>
                <PopoverContent
                  sideOffset={10}
                  side="bottom"
                  className="bg-white flex flex-col gap-8 shadow-md max-w-80"
                >
                  <p className="font-bold text-sm leading-5 text-gray-900">AI-Powered Product Tours!</p>
                  <p className="text-sm leading-5 text-gray-500">
                    Revolutionize your user onboarding with our AI voice agent. Create interactive, voice-guided tours
                    that engage users and showcase your SaaS product's best features. <br /> <br /> Boost adoption rates
                    and user satisfaction in minutes, not days.
                  </p>
                  <div className="flex items-center justify-between">
                    <VoiceWave />
                    <Link href="/sign-up">
                      <Button>Create a tour</Button>
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="py-12 sm:py-16 mx-auto max-w-7xl px-6 lg:px-8 lg:col-span-12">
              <h2 className="text-base sm:text-xl lg:text-lg xl:text-xl tracking-tight text-center text-gray-900">
                Trusted by
              </h2>
              <div className="mx-auto mt-8 grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5">
                <img
                  className="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
                  src="logoipsum_1.svg"
                  alt="Logoipsum"
                  width="158"
                  height="48"
                />
                <img
                  className="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
                  src="logoipsum_2.svg"
                  alt="Logoipsum"
                  width="158"
                  height="48"
                />
                <img
                  className="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
                  src="logoipsum_3.svg"
                  alt="Logoipsum"
                  width="158"
                  height="48"
                />
                <img
                  className="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
                  src="logoipsum_4.svg"
                  alt="Logoipsum"
                  width="158"
                  height="48"
                />
                <img
                  className="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
                  src="logoipsum_5.svg"
                  alt="Logoipsum"
                  width="158"
                  height="48"
                />
              </div>
            </div>

            {/*             <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:col-start-4 lg:flex lg:items-center">
              <Terminal />
            </div> */}
          </div>
        </div>
      </section>
    </main>
  );
}
