import { Card } from '@workspace/ui/components/card'
import Link from 'next/link'

export function TemplateLink() {
	return (
		<Link href="/create">
			<Card className="group max-w-64 flex items-center gap-3 px-4 py-2 hover:bg-gray-50 hover:border-gray-200 transition-colors">
				<div className="border border-accent-foreground/50 w-4 h-3.75 flex flex-col justify-evenly px-0.5">
					<div className="border-t border-accent-foreground/50 w-full" />
					<div className="border-t border-accent-foreground/50 w-1/2 transition-all duration-200 group-hover:w-full group-hover:border-violet-700" />
					<div className="border-t border-accent-foreground/50 w-full" />
				</div>
				<div className="grid">
					<p className="font-bold text-gray-700 text-sm truncate">Start from a template</p>
					<p className="font-normal text-gray-500 text-xs truncate">Pick a pre-built layout</p>
				</div>
			</Card>
		</Link>
	)
}
