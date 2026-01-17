'use client'

import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Loader2Icon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useActionState } from 'react'
import type { ActionState } from '@/lib/auth/middleware'
import { signIn, signInWithOAuth, signUp } from './actions'

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
	const searchParams = useSearchParams()
	const redirect = searchParams.get('redirect')
	const priceId = searchParams.get('priceId')
	const inviteId = searchParams.get('inviteId')
	const [state, formAction, pending] = useActionState<ActionState, FormData>(
		mode === 'signin' ? signIn : signUp,
		{
			error: '',
		},
	)

	async function handleSignInWithOAuth() {
		await signInWithOAuth(inviteId)
	}

	return (
		<div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
			<div className="sm:mx-auto sm:w-full sm:max-w-sm">
				<Link href={'/'} className="flex justify-center items-center">
					<Image src="/icons/meli.svg" alt="Meli logo" width={30} height={30} />
					<span className="ml-2 text-2xl font-semibold text-gray-900 lowercase">Meli</span>
				</Link>
				<h2 className="mt-6 text-center text-sm font-normal text-gray-900">
					{mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
				</h2>
			</div>
			<div className="mt-4 sm:mx-auto sm:w-full sm:max-w-sm">
				<form className="space-y-2" action={formAction}>
					<input type="hidden" name="redirect" value={redirect || ''} />
					<input type="hidden" name="priceId" value={priceId || ''} />
					<input type="hidden" name="inviteId" value={inviteId || ''} />

					<Input
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						required
						maxLength={50}
						placeholder="Email"
					/>
					<Input
						id="password"
						name="password"
						type="password"
						autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
						required
						minLength={8}
						maxLength={100}
						placeholder="Password"
					/>
					<Button type="submit" className="w-full" disabled={pending}>
						{pending ? (
							<>
								<Loader2Icon className="animate-spin mr-2 h-4 w-4" />
								Loading...
							</>
						) : mode === 'signin' ? (
							'Sign in'
						) : (
							'Sign up'
						)}
					</Button>

					<div className="text-red-500 text-sm h-5">{state.error}</div>
				</form>

				<Button className="w-full mt-4" variant={'outline'} onClick={handleSignInWithOAuth}>
					<Image src={'/icons/google.svg'} alt="Google logo" height={16} width={16} />
					Continue with Google
				</Button>

				<div className="mt-6">
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-gray-300" />
						</div>
						<div className="relative flex justify-center text-xs">
							<span className="px-2 bg-gray-50 text-muted-foreground">
								{mode === 'signin' ? 'New to our platform?' : 'Already have an account?'}
							</span>
						</div>
					</div>

					<div className="mt-6">
						<Button asChild variant={'outline'} className="w-full">
							<Link
								href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
									redirect ? `?redirect=${redirect}` : ''
								}${priceId ? `&priceId=${priceId}` : ''}`}
							>
								{mode === 'signin' ? 'Create an account' : 'Sign in to existing account'}
							</Link>
						</Button>
					</div>
				</div>

				<div className="mt-6">
					<div className="text-xs text-zinc-950/50 dark:text-white/50 decoration-zinc-950/30 dark:decoration-white/30 underline-offset-[3px]">
						By signing {mode === 'signin' ? 'in' : 'up'}, you agree to the{' '}
						<Link
							href="/terms-of-use"
							className="underline hover:dark:text-white/70 hover:dark:decoration-white/70"
							target="_blank"
						>
							Terms of Service
						</Link>{' '}
						and{' '}
						<Link
							href="/privacy-policy"
							className="underline hover:dark:text-white/70 hover:dark:decoration-white/70"
							target="_blank"
						>
							Privacy Policy
						</Link>
						.
					</div>
				</div>
			</div>
		</div>
	)
}
