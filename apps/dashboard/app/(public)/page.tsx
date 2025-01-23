'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@workspace/ui/components/accordion';
import { Button } from '@workspace/ui/components/button';
import meli from 'meli.js';
import Link from 'next/link';
import MetricsSection from './_components/metrics-section';

// function VoiceWave() {
//   const [amplitude, setAmplitude] = useState(0);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setAmplitude((prev) => (prev + 1) % 5);
//     }, 200);
//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div className="flex justify-center items-center bg-white">
//       <div className="relative flex items-center justify-center gap-1.5">
//         {[...Array(5)].map((_, i) => (
//           <div
//             key={i}
//             className="rounded-full
//               transition-all
//               duration-300
//               ease-in-out
//               bg-gradient-to-b
//               from-gray-50
//               to-purple-500
//               shadow-md"
//             style={{
//               width: '5px',
//               height: `${10 + (i === amplitude ? 20 : 0)}px`,
//               opacity: 0.4 + i * 0.1,
//             }}
//           />
//         ))}
//       </div>
//     </div>
//   );
// }

export default function HomePage() {
  function startTour() {
    meli.init('9');
  }
  return (
    <main className="bg-gray-50">
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:text-center md:max-w-2xl md:mx-auto lg:col-span-12">
              <h1
                id="ms-dd809dceb71260420ff2d00c27b19b04"
                className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl"
              >
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
            <a href="https://hi.meli-ai.com/founders"></a>

            <div className="mt-12 mx-auto max-w-2xl col-span-12">
              <div className="flex items-center gap-2">
                <Button
                  id="ms-dd809dceb71260420ff2d00c27b19b11"
                  asChild
                >
                  <Link href={'/sign-up'}>Sign up for free</Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={startTour}
                >
                  Get a demo
                </Button>
              </div>
            </div>

            <div className="py-12 sm:py-16 mx-auto max-w-7xl lg:col-span-12">
              <h2 className="text-base tracking-tight text-center text-gray-900">Backed by</h2>
              <div className="mt-4 grid place-items-center">
                <a href="https://elevenlabs.io/text-to-speech">
                  <img
                    className="max-h-12 max-w-[260px]"
                    loading="lazy"
                    src="https://storage.googleapis.com/eleven-public-cdn/images/elevenlabs-grants-logo.png"
                    alt="Text to Speech"
                  ></img>
                </a>
              </div>
            </div>

            <div className="py-12 sm:py-16 mx-auto max-w-7xl lg:col-span-12">
              <MetricsSection />
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
                    choosing our Base or Plus plan.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Are tour steps animated?</AccordionTrigger>
                  <AccordionContent>Yes. The tour steps are animated by default.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Is a developer needed to implement a product tour?</AccordionTrigger>
                  <AccordionContent>
                    Yes. Loading the product tour in your webapp requires developer intervention. Creating the tour
                    itself can be done no-code.
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
