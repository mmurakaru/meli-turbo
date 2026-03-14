'use client'

import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@workspace/ui/components/dialog'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Separator } from '@workspace/ui/components/separator'
import { Loader2, Trash2 } from 'lucide-react'
import { startTransition, useActionState, useRef, useState } from 'react'
import { deleteAccount, updateAccount, updatePassword } from '@/app/(login)/actions'
import { useUser } from '@/lib/auth'

type ActionState = {
	error?: string
	success?: string
}

export default function SecurityPage() {
	const { user } = useUser()
	const [deleteOpen, setDeleteOpen] = useState(false)
	const deleteFormRef = useRef<HTMLFormElement>(null)

	const [passwordState, passwordAction, isPasswordPending] = useActionState<ActionState, FormData>(
		updatePassword,
		{ error: '', success: '' },
	)

	const [deleteState, deleteAction, isDeletePending] = useActionState<ActionState, FormData>(
		deleteAccount,
		{ error: '', success: '' },
	)

	const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		startTransition(() => {
			passwordAction(new FormData(event.currentTarget))
		})
	}

	const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateAccount, {
		error: '',
		success: '',
	})

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		startTransition(() => {
			formAction(new FormData(event.currentTarget))
		})
	}

	return (
		<section className="flex-1">
			<h1 className="text-lg lg:text-2xl font-extrabold text-gray-900 mb-6">Account Settings</h1>
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Account Information</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={handleSubmit}>
						<div className="grid gap-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								name="name"
								placeholder="Your name"
								defaultValue={user?.name || ''}
								required
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="Your email"
								defaultValue={user?.email || ''}
								required
							/>
						</div>
						{state.error && <p className="text-red-500 text-xs">{state.error}</p>}
						{state.success && <p className="text-green-500 text-xs">{state.success}</p>}
						<Button type="submit" variant="secondary" disabled={isPending} size="sm">
							{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Save Changes</>}
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Password</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={handlePasswordSubmit}>
						<div className="grid gap-2">
							<Label htmlFor="current-password">Current Password</Label>
							<Input
								id="current-password"
								name="currentPassword"
								type="password"
								autoComplete="current-password"
								required
								minLength={8}
								maxLength={100}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="new-password">New Password</Label>
							<Input
								id="new-password"
								name="newPassword"
								type="password"
								autoComplete="new-password"
								required
								minLength={8}
								maxLength={100}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="confirm-password">Confirm New Password</Label>
							<Input
								id="confirm-password"
								name="confirmPassword"
								type="password"
								required
								minLength={8}
								maxLength={100}
							/>
						</div>
						{passwordState.error && <p className="text-red-500 text-xs">{passwordState.error}</p>}
						{passwordState.success && (
							<p className="text-green-500 text-xs">{passwordState.success}</p>
						)}
						<Button type="submit" variant="secondary" disabled={isPasswordPending} size="sm">
							{isPasswordPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<>Update Password</>
							)}
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-semibold text-sm">Delete Account</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								Account deletion is non-reversable. Please proceed with caution.
							</p>
						</div>
						<Button
							type="button"
							variant="destructive-outline"
							size="sm"
							className="ml-6 shrink-0"
							onClick={() => setDeleteOpen(true)}
						>
							Delete Account
						</Button>
					</div>
				</CardContent>
			</Card>

			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent className="sm:max-w-md p-0 gap-0" aria-describedby={undefined}>
					<DialogHeader className="p-3">
						<div className="flex items-center gap-1.5 text-foreground">
							<Badge variant="secondary" className="flex gap-1.5 py-1 text-xs font-normal">
								<Trash2 className="size-3 stroke-red-500" strokeWidth={1} />
								Delete account
							</Badge>
							<DialogTitle className="sr-only">Permanently delete your account?</DialogTitle>
						</div>
					</DialogHeader>

					<form
						ref={deleteFormRef}
						onSubmit={(e) => {
							e.preventDefault()
							startTransition(() => {
								deleteAction(new FormData(e.currentTarget))
							})
						}}
					>
						<div className="px-3 pb-3 space-y-4">
							<p className="text-sm text-muted-foreground py-2">
								Your account and all associated data will be permanently deleted. This cannot be
								undone.
							</p>
							<div className="grid gap-2">
								<Label htmlFor="delete-password">Confirm your password</Label>
								<Input
									id="delete-password"
									name="password"
									type="password"
									placeholder="Enter your password"
									required
									minLength={8}
									maxLength={100}
								/>
							</div>
							{deleteState.error && <p className="text-red-500 text-xs">{deleteState.error}</p>}
						</div>

						<Separator />
						<DialogFooter className="gap-2 p-3 sm:justify-end">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setDeleteOpen(false)}
							>
								Keep account
							</Button>
							<Button
								type="submit"
								variant="destructive"
								size="sm"
								className="bg-red-600 hover:bg-red-700"
								disabled={isDeletePending}
							>
								{isDeletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete account'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</section>
	)
}
