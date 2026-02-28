import { Card, CardContent } from '@workspace/ui/components/card'
import { CheckCircle, Clock, MessageSquare, UserPlus, Zap } from 'lucide-react'

const metrics = [
	{
		icon: <CheckCircle className="w-8 h-8" strokeWidth={1} />,
		title: 'Instant Generation',
		description: 'Go from a plain-language description to a structured spreadsheet in seconds.',
	},
	{
		icon: <Clock className="w-8 h-8" strokeWidth={1} />,
		title: 'Time Saved',
		description: 'Eliminate hours of manual spreadsheet setup - Meli does the heavy lifting.',
	},
	{
		icon: <UserPlus className="w-8 h-8" strokeWidth={1} />,
		title: 'Team Adoption',
		description: 'Get your whole team working in shared spreadsheets from day one.',
	},
	{
		icon: <Zap className="w-8 h-8" strokeWidth={1} />,
		title: 'Fast Iteration',
		description: 'Edit, restructure, and iterate on spreadsheets without starting from scratch.',
	},
	{
		icon: <MessageSquare className="w-8 h-8" strokeWidth={1} />,
		title: 'Natural Language First',
		description: 'No formulas, no setup - just describe what you need and Meli builds it.',
	},
]

export default function MetricsSection() {
	return (
		<section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
			<h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl text-center mb-12">
				Why Teams Choose Meli
			</h2>
			<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
				{metrics.map((metric, index) => (
					<Card
						key={metric.title}
						className="bg-gray-50  rounded-[0.25rem] p-6"
						id={index === 4 ? 'ms-dd809dceb71260420ff2d00c27b19b05' : undefined}
					>
						<CardContent>
							<div className="flex items-center justify-center mb-4">{metric.icon}</div>
							<h3 className="text-base font-bold text-gray-900 text-center mb-2">{metric.title}</h3>
							<p className="text-sm text-gray-500 text-center">{metric.description}</p>
						</CardContent>
					</Card>
				))}
			</div>
		</section>
	)
}
