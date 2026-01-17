import { redirect } from 'next/navigation'
import { getAllTours, getToursForOwner, getUser } from '@/lib/db/queries'
import { Recents } from './recents'

export default async function RecentsPage() {
	const user = await getUser()

	if (!user) {
		redirect('/sign-in')
	}

	const privateToursData = getToursForOwner(user.id, 'user')
	const allToursData = getAllTours(user.id)

	// Initiate both requests in parallel
	const [privateTours, allTours] = await Promise.all([privateToursData, allToursData])

	const tourData = {
		private: privateTours,
		all: allTours,
	}

	return <Recents tourData={tourData} />
}
