'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs'
import Image from 'next/image'
import Link from 'next/link'
import type { DocumentListItem } from '@/lib/db/schema'
import { NewDocumentLink } from '../_components/new-document-link'
import { normalizedDocuments } from '../helper/normalize-document.helper'

export function Recents({
	documentData,
}: {
	documentData: { private: DocumentListItem[]; all: DocumentListItem[] }
}) {
	return (
		<section className="flex-1">
			<h1 className="text-lg lg:text-2xl font-extrabold mb-6">Recents</h1>
			<NewDocumentLink />

			<Tabs defaultValue="private">
				<TabsList className="w-[200px] grid grid-cols-2">
					<TabsTrigger value="private">Private</TabsTrigger>
					<TabsTrigger value="all">All</TabsTrigger>
				</TabsList>

				<TabsContent value="private" className="mt-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ">
						{normalizedDocuments(documentData.private).map((doc) => (
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
				</TabsContent>

				<TabsContent value="all" className="mt-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ">
						{normalizedDocuments(documentData.all).map((doc) => (
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
				</TabsContent>
			</Tabs>
		</section>
	)
}
