'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { DocumentListItem, Workspace } from '@/lib/db/schema'
import { NewDocumentLink } from '../../_components/new-document-link'
import { normalizedDocuments } from '../../helper/normalize-document.helper'

export function WorkspaceDocuments({
	workspace,
	documentData,
}: {
	workspace: Workspace
	documentData: DocumentListItem[]
}) {
	return (
		<section className="flex-1">
			<h1 className="text-lg lg:text-2xl font-extrabold mb-6">{workspace.name}</h1>
			<NewDocumentLink />

			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
				{normalizedDocuments(documentData).map((doc) => (
					<div key={doc.id}>
						<Link href={`/document/${doc.id}`}>
							<Image
								src={`/api/og?title=${encodeURIComponent(doc.title)}`}
								alt={doc.title}
								width={1200}
								height={700}
								unoptimized
								className="w-full aspect-384/224 rounded-xl border"
							/>
						</Link>
						<div className="py-4">
							<p className="font-bold text-gray-700 text-sm truncate">{doc.title}</p>
							<div className="flex items-center gap-1">
								<p className="font-normal text-gray-500 text-xs">
									In <b className="text-gradient font-normal">{doc.ownerType}</b>
								</p>
								<div className="text-gray-500">&middot;</div>
								<p className="font-normal text-gray-500 text-xs">Updated {doc.updatedAt}</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</section>
	)
}
