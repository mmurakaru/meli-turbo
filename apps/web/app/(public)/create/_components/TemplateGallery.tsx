'use client'

import { Badge } from '@workspace/ui/components/badge'
import Image from 'next/image'
import { TEMPLATES } from '../_data/templates'

type TemplateGalleryProps = {
	onSelectTemplate: (prompt: string, title: string) => void
}

const CATEGORY_LABELS: Record<string, string> = {
	business: 'Business',
	hr: 'HR',
	finance: 'Finance',
	personal: 'Personal',
}

const CATEGORY_COLORS: Record<string, string> = {
	business: 'bg-violet-100 text-gray-700 hover:bg-violet-100',
	hr:       'bg-lime-100 text-gray-700 hover:bg-lime-100',
	finance:  'bg-stone-200 text-gray-700 hover:bg-stone-200',
	personal: 'bg-purple-100 text-gray-700 hover:bg-purple-100',
}

export function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
			{TEMPLATES.map((template) => {
				const ogSrc = `/api/og?title=${encodeURIComponent(template.title)}&columns=${encodeURIComponent(JSON.stringify(template.previewColumns))}&rows=${encodeURIComponent(JSON.stringify(template.previewRows))}`
				return (
					<button
						key={template.id}
						type="button"
						className="group/card text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-xl"
						onClick={() => onSelectTemplate(template.prompt, template.title)}
					>
						<div className="relative rounded-xl p-px overflow-hidden bg-gray-200 group-hover/card:bg-transparent">
							{/* Rotating conic gradient border */}
							<div className="absolute -inset-full animate-[spin_3s_linear_infinite] opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-[conic-gradient(from_0deg,#8b5cf6_0%,#c4b5fd_15%,#e5e7eb_30%,transparent_50%,transparent_85%,#8b5cf6_100%)]" />
							<Image
								src={ogSrc}
								alt={template.title}
								width={1200}
								height={700}
								unoptimized
								className="relative w-full aspect-384/224 rounded-[11px]"
							/>
						</div>
						<div className="py-4">
							<p className="font-bold text-gray-700 text-sm truncate">{template.title}</p>
							<Badge variant="secondary" className={`mt-1 text-xs font-normal ${CATEGORY_COLORS[template.category] ?? ''}`}>
								{CATEGORY_LABELS[template.category]}
							</Badge>
						</div>
					</button>
				)
			})}
		</div>
	)
}
