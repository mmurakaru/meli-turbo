import { Toaster } from '@workspace/ui/components/sonner'
import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import { UserProvider } from '@/lib/auth'
import { getUser } from '@/lib/db/queries'
import CookieConsent from './_components/cookie-consent'
import './globals.css'
// import ScriptLoader from './script-loader';

export const metadata: Metadata = {
	title: 'Meli | Voice AI product tour',
	description: 'Voice AI product tour',
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
				<UserProvider userPromise={userPromise}>{children}</UserProvider>
				{/* <ScriptLoader /> */}
				<Toaster />
				<CookieConsent />
			</body>
		</html>
	)
}
