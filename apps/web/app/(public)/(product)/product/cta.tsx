import { Button } from '@workspace/ui/components/button'
import Link from 'next/link'

export default function CTA() {
	return (
		<section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
			<h2 className="text-3xl font-extrabold sm:text-4xl text-gray-900">
				<span className="block">Ready to rethink how you work with spreadsheets?</span>
				<span className="block">Start building for free today.</span>
			</h2>
			<p className="mt-4 text-lg leading-6 text-gray-500 mb-8">
				Join teams already using Meli to create spreadsheets <br /> from natural language - fast,
				intuitive, and free.
			</p>
			<Button asChild>
				<Link href="/sign-up">Sign up for free</Link>
			</Button>
		</section>
	)
}
