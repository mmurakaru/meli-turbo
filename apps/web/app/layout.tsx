import { Toaster } from '@workspace/ui/components/sonner'
import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import { Suspense } from 'react'
import { UserProvider } from '@/lib/auth'
import { getUser } from '@/lib/db/queries'
import CookieConsent from './_components/cookie-consent'
import './globals.css'

export const metadata: Metadata = {
	title: 'Meli | AI spreadsheet builder',
	description: 'AI spreadsheet builder',
}

export const viewport: Viewport = {
	maximumScale: 1,
}

const manrope = Manrope({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
	const userPromise = getUser()

	return (
		<html
			lang="en"
			className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
		>
			<body className="min-h-[100dvh]">
				<Suspense fallback={null}>
					<UserProvider userPromise={userPromise}>{children}</UserProvider>
				</Suspense>
				<Toaster />
				<CookieConsent />
			</body>
		</html>
	)
}
