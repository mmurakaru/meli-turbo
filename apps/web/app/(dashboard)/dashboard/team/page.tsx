import { redirect } from 'next/navigation'
import { getDocumentsForOwner, getTeamForUser, getUser } from '@/lib/db/queries'
import { Team } from './team'

export default async function TeamPage() {
	const user = await getUser()

	if (!user) {
		redirect('/sign-in')
	}

	const team = await getTeamForUser(user.id)

	if (!team) {
		redirect('/sign-in')
	}

	const tourData = await getDocumentsForOwner(team.id, 'team')

	return <Team tourData={tourData} />
}
