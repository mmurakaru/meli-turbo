import { redirect } from 'next/navigation'
import { getDocument, getTeamForUser, getUser } from '@/lib/db/queries'
import { SpreadsheetView } from '../../../_components/spreadsheet-view'
import { TourHeader } from './tour-header'

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
	const id = (await params).id

	const user = await getUser()
	if (!user) {
		redirect('/sign-in')
	}

	const tour = await getDocument(Number(id), user.id)

	if (!tour) {
		redirect('/not-found')
	}

	const userTeam = await getTeamForUser(user.id)

	const hasPermission =
		(tour.ownerId === user.id && tour.ownerType === 'user') ||
		(tour.ownerId === userTeam?.id && tour.ownerType === 'team')

	if (!hasPermission) {
		redirect('/not-found')
	}

	return (
		<section className="flex-1 p-6">
			<TourHeader tourId={tour.id} description={tour.description} title={tour.title} />
			<div className="mt-6">
				<SpreadsheetView columns={tour.data.columns} rows={tour.data.rows} />
			</div>
		</section>
	)
}
