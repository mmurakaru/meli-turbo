import { redirect } from 'next/navigation'
import { getAllDocuments, getDocumentsForOwner, getUser } from '@/lib/db/queries'
import { Recents } from './recents'

export default async function RecentsPage() {
	const user = await getUser()

	if (!user) {
		redirect('/sign-in')
	}

	const privateDocumentsData = getDocumentsForOwner(user.id, 'user')
	const allDocumentsData = getAllDocuments(user.id)

	// Initiate both requests in parallel
	const [privateDocuments, allDocuments] = await Promise.all([privateDocumentsData, allDocumentsData])

	const documentData = {
		private: privateDocuments,
		all: allDocuments,
	}

	return <Recents documentData={documentData} />
}
