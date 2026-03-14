import { format } from 'date-fns'
import type { Document, OwnerType } from '@/lib/db/schema'

export function normalizeTour(tour: Document): NormalizedTour {
	function translateOwnerType(type: OwnerType) {
		switch (type) {
			case 'team':
				return 'Team'
			default:
				return 'Private'
		}
	}

	return {
		id: tour.id,
		createdAt: tour.createdAt,
		updatedAt: format(tour.updatedAt, 'MMM dd, yyyy'),
		deletedAt: tour.deletedAt,
		ownerId: tour.ownerId,
		ownerType: translateOwnerType(tour.ownerType),
		title: tour.title,
		description: tour.description,
	}
}

export function normalizedTours(tourData: Document[]): NormalizedTour[] {
	const normalizedToursList: NormalizedTour[] = []
	for (const tour of tourData) {
		normalizedToursList.push(normalizeTour(tour))
	}
	return normalizedToursList
}

export interface NormalizedTour extends Omit<Document, 'ownerType' | 'updatedAt'> {
	ownerType: string
	updatedAt: string
}
