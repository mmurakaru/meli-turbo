import { Card } from '@workspace/ui/components/card'
import Link from 'next/link'
import { NEW_DOCUMENT_PATHNAME } from '../constants/dashboard.constants'
import { TemplateLink } from './template-link'

export function NewDocumentLink() {
	return (
		<div className="flex items-center gap-4 mb-6">
			<Link href={NEW_DOCUMENT_PATHNAME}>
				<Card className="group max-w-64 flex items-center gap-3 px-4 py-2 hover:bg-gray-50 hover:border-gray-200 transition-colors">
					<div className="flex">
						<div className="border border-accent-foreground/50 w-1 h-3.75"></div>
						<div className="border border-accent-foreground/50 w-1 h-3.75 mx-0.5"></div>
						<div className="border border-accent-foreground/50 w-1 h-3.75 -translate-y-0.5 transition duration-200 group-hover:border-violet-700 group-hover:translate-y-0"></div>
					</div>
					<div className="grid">
						<p className="font-bold text-gray-700 text-sm truncate">Create new spreadsheet</p>
						<p className="font-normal text-gray-500 text-xs truncate">Start from blank</p>
					</div>
				</Card>
			</Link>
			<TemplateLink />
		</div>
	)
}
