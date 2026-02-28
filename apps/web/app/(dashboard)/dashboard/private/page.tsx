import { redirect } from 'next/navigation'
import { getToursForOwner, getUser } from '@/lib/db/queries'
import { Private } from './private'

export default async function PrivatePage() {
	const user = await getUser()

	if (!user) {
		redirect('/sign-in')
	}

	const tourData = await getToursForOwner(user.id, 'user')

	return <Private tourData={tourData} />
}
