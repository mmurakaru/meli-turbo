import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/auth/session'

const protectedRoutes = ['/dashboard', '/workspace']
const publicRoutes = ['/sign-in', '/sign-up', '/']

export default async function proxy(req: NextRequest) {
	const path = req.nextUrl.pathname
	const isProtectedRoute = protectedRoutes.some(
		(route) => path === route || path.startsWith(`${route}/`),
	)
	const isPublicRoute = publicRoutes.includes(path)

	const cookie = (await cookies()).get('session')?.value
	const session = await decrypt(cookie)

	if (isProtectedRoute && !session?.userId) {
		return NextResponse.redirect(new URL('/sign-in', req.nextUrl))
	}

	if (isPublicRoute && session?.userId && !req.nextUrl.pathname.startsWith('/dashboard')) {
		return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
