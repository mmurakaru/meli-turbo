'use client'

import { Button } from '@workspace/ui/components/button'
import { FolderCode, Rocket } from 'lucide-react'
import Link from 'next/link'

export default function ProductUseCasePage() {
	return (
		<main className="bg-gray-50">
			<section className="py-20">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="lg:grid lg:grid-cols-12 lg:gap-8">
						<div className="lg:text-center md:max-w-2xl md:mx-auto lg:col-span-12">
							<h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
								Spreadsheet Use Cases & Examples
							</h1>
							<p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
								See how teams use Meli to go from plain language to structured data - instantly.
							</p>
						</div>

						<div className="mt-12 mx-auto max-w-2xl col-span-12">
							<div className="flex items-center gap-2 justify-center">
								<Button asChild>
									<Link href={'/sign-up'}>Sign up for free</Link>
								</Button>
								{/* <Button
                  asChild
                  variant="outline"
                >
                  <Link href={'/dashboard/templates'}>Browse Templates</Link>
                </Button> */}
							</div>
						</div>

						<div className="py-12 sm:py-16 mx-auto max-w-7xl lg:col-span-12">
							<UseCases />
						</div>
					</div>
				</div>
			</section>
		</main>
	)
}

function UseCases() {
	const cases = [
		{
			icon: Rocket,
			title: 'Project Planning',
			description:
				'Describe your project scope in plain language and Meli generates a structured planning spreadsheet with tasks, owners, and timelines - ready to edit immediately.',
			instructions: [
				'Describe the project goals and team size',
				'Let Meli generate the initial structure',
				'Adjust columns and rows to fit your workflow',
			],
			triggering:
				'Best used at the start of a new project. Share the spreadsheet with your team workspace so everyone has access.',
		},
		{
			icon: FolderCode,
			title: 'Data Collection & Reporting',
			description:
				'Turn a plain-language description of your data needs into a structured spreadsheet. Perfect for collecting survey responses, tracking metrics, or building reports.',
			instructions: [
				'Describe the data fields you need to capture',
				'Let Meli scaffold the structure',
				'Add validation rules or custom columns as needed',
			],
			triggering:
				'Works great for recurring reporting needs. Duplicate the spreadsheet each period and update with fresh data.',
		},
	]

	return (
		<div className="grid md:grid-cols-2 gap-8">
			{cases.map((useCase) => (
				<div
					key={useCase.title}
					className="rounded-[0.25rem] px-6 py-8 border border-violet-500 flex flex-col"
				>
					<span className="inline-flex items-center justify-center p-3 border border-violet-500 rounded-[0.25rem] max-w-fit">
						<useCase.icon
							strokeWidth={1}
							className="h-6 w-6 text-white stroke-violet-500"
							aria-hidden="true"
						/>
					</span>
					<h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{useCase.title}</h3>
					<p className="mt-5 text-base text-gray-500">{useCase.description}</p>
					<div className="my-6">
						<h4 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h4>
						<ul className="list-disc pl-5 space-y-2">
							{useCase.instructions.map((instruction) => (
								<li key={instruction} className="text-gray-600">
									{instruction}
								</li>
							))}
						</ul>
					</div>
					<div className="mt-auto">
						<h4 className="text-lg font-semibold text-gray-900 mb-2">
							Triggering and Segmentation
						</h4>
						<p className="text-gray-600">{useCase.triggering}</p>
					</div>
				</div>
			))}
		</div>
	)
}
