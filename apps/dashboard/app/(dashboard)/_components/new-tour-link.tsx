import { Card } from '@workspace/ui/components/card'
import Link from 'next/link'
import { NEW_TOUR_PATHNAME } from '../constants/dashboard.constants'

export function NewTourLink() {
	return (
		<Link href={NEW_TOUR_PATHNAME}>
			<Card className="group max-w-64 flex items-center gap-3 px-4 py-2 hover:bg-gray-50 hover:border-gray-200 transition-colors mb-6">
				<div className="flex">
					<div className="border border-accent-foreground/50 w-[4px] h-[15px]"></div>
					<div className="border border-accent-foreground/50 w-[4px] h-[15px] mx-[2px]"></div>
					<div className="border border-accent-foreground/50 w-[4px] h-[15px] -translate-y-0.5 transition duration-200 group-hover:border-violet-700 group-hover:translate-y-0"></div>
				</div>
				<div className="grid">
					<p className="font-bold text-gray-700 text-sm truncate">Create new tour</p>
					<p className="font-normal text-gray-500 text-xs truncate">Start from blank</p>
				</div>
			</Card>
		</Link>
	)
}
