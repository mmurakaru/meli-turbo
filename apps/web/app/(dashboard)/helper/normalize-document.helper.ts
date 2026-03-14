import { format } from 'date-fns'
import type { Document, OwnerType } from '@/lib/db/schema'

export function normalizeDocument(document: Document): NormalizedDocument {
	function translateOwnerType(type: OwnerType) {
		switch (type) {
			case 'workspace':
				return 'Workspace'
			default:
				return 'Private'
		}
	}

	return {
		id: document.id,
		createdAt: document.createdAt,
		updatedAt: format(document.updatedAt, 'MMM dd, yyyy'),
		deletedAt: document.deletedAt,
		ownerId: document.ownerId,
		ownerType: translateOwnerType(document.ownerType),
		title: document.title,
		description: document.description,
	}
}

export function normalizedDocuments(documentData: Document[]): NormalizedDocument[] {
	const normalizedDocs: NormalizedDocument[] = []
	for (const document of documentData) {
		normalizedDocs.push(normalizeDocument(document))
	}
	return normalizedDocs
}

export interface NormalizedDocument extends Omit<Document, 'ownerType' | 'updatedAt'> {
	ownerType: string
	updatedAt: string
}
