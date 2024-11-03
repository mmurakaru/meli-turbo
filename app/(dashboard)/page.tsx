'use client';

import Vapi from '@vapi-ai/web';
import { useEffect, useState } from 'react';
import { create } from '../actions';
import { Terminal } from './terminal';

export default function HomePage() {
  const [assistantId, setAssistantId] = useState();
  const publicVapiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

  if (!publicVapiKey) {
    throw new Error('NEXT_PUBLIC_VAPI_PUBLIC_KEY is not defined.');
  }

  const vapi = new Vapi(publicVapiKey);

  async function handleStart() {
    await vapi.start(assistantId);
  }

  async function handleStop() {
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
                Launch your SaaS product tour in record time with our powerful voice agent.
              </p>
            </div>
            <div className="flex flex-col gap-2 mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:col-start-4 lg:flex lg:items-center">
              <button
                className="bg-purple-400 p-2 rounded-lg"
                onClick={handleStart}
              >
                Start Onboarding
              </button>
              <button
                className="border border-purple-400 p-2 rounded-lg"
                onClick={handleStop}
              >
                Stop Onboarding
              </button>
              <p className="mt-3 text-base text-center text-gray-500">Give it a try!</p>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:col-start-4 lg:flex lg:items-center">
              <Terminal />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
