import { Tour } from '@/lib/db/schema';
import { format } from 'date-fns';

export function normalizeTour(tour: Tour): NormalizedTour {
  function translateOwnerType(type: 'team' | 'user') {
    switch (type) {
      case 'team':
        return 'Team';
      default:
        return 'Private';
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
  };
}

export function normalizedTours(tourData: Tour[]): NormalizedTour[] {
  const tours = tourData;

  const normalizedTours: NormalizedTour[] = [];
  for (const tour of tours) {
    const normalizedCard = normalizeTour(tour);

    normalizedTours.push(normalizedCard);
  }

  return normalizedTours;
}

export interface NormalizedTour extends Omit<Tour, 'ownerType' | 'updatedAt'> {
  ownerType: string;
  updatedAt: string;
}
