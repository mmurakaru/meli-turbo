'use client'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@workspace/ui/components/accordion'
import { Button } from '@workspace/ui/components/button'
// import meli from 'meli.js'
import Image from 'next/image'
import Link from 'next/link'
import MetricsSection from './_components/metrics-section'

export default function HomePage() {
	// function startTour() {
	// 	meli.init('9')
	// }
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
								The{' '}
								<span className="bg-linear-to-r from-[#2d3af7] to-[#c90add] text-transparent bg-clip-text inline-block sm:leading-15 md:leading-18">
									fastest
								</span>{' '}
								way to create spreadsheets.
							</h1>
							<p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
								The free, intuitive spreadsheet builder for teams who move fast.
								<br />
								From natural language to editable grid - ready in seconds.
							</p>
						</div>

						<div className="mt-12 mx-auto max-w-2xl col-span-12">
							<div className="flex items-center gap-2">
								<Button id="ms-dd809dceb71260420ff2d00c27b19b11" asChild>
									<Link href={'/sign-up'}>Sign Up</Link>
								</Button>
								<Button variant="outline" asChild>
									<Link href={'/create'}>Try it for free</Link>
								</Button>
							</div>
						</div>

						<div className="py-12 sm:py-16 mx-auto max-w-7xl lg:col-span-12">
							<h2 className="text-base tracking-tight text-center text-gray-900">Backed by</h2>
							<div className="mt-4 grid place-items-center">
								<a href="https://elevenlabs.io/text-to-speech">
									<Image
										className="max-h-12 max-w-65"
										src="https://storage.googleapis.com/eleven-public-cdn/images/elevenlabs-grants-logo.png"
										alt="Text to Speech"
										width={260}
										height={48}
										loading="lazy"
									/>
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
							<Accordion type="single" collapsible className="w-full">
								<AccordionItem value="item-1">
									<AccordionTrigger>Can I configure the voice agent?</AccordionTrigger>
									<AccordionContent>
										Yes. You will be able to choose from a set of options to configure the
										conversational AI.
									</AccordionContent>
								</AccordionItem>
								<AccordionItem value="item-2">
									<AccordionTrigger>Are tooltips styled & branded?</AccordionTrigger>
									<AccordionContent>
										Yes. Tooltips come with default styles and Meli branding, you can get unbranded
										tooltips when choosing our Base plan and above.
									</AccordionContent>
								</AccordionItem>
								<AccordionItem value="item-3">
									<AccordionTrigger>
										Do I have control over when a tour starts or ends in my app?
									</AccordionTrigger>
									<AccordionContent>
										Yes. You will be able to define costum triggers to start and/or end tours and
										more.
									</AccordionContent>
								</AccordionItem>
								<AccordionItem value="item-4">
									<AccordionTrigger>
										Is a developer needed to implement a product tour?
									</AccordionTrigger>
									<AccordionContent>
										Yes. Loading the product tour in your webapp requires developer intervention.
										Creating the tour itself can be done no-code.
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</div>
					</div>
				</div>
			</section>
		</main>
	)
}
