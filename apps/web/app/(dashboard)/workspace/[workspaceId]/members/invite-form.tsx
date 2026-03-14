'use client'

import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from '@workspace/ui/components/select'
import { toast } from '@workspace/ui/components/sonner'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import type { ActionState } from '@/lib/auth/middleware'
import { inviteMember } from '../../../actions'

export function InviteForm({ workspaceId, isPaid }: { workspaceId: string; isPaid: boolean }) {
	const [state, formAction, isPending] = useActionState<ActionState, FormData>(inviteMember, {
		error: '',
		success: '',
	})

	useEffect(() => {
		if (state?.error) toast.error(state.error)
		if (state?.success) toast.success(state.success)
	}, [state])

	return (
		<div className="border rounded-lg p-6 mb-4">
			<div className="flex items-center justify-between mb-4">
				<p className="font-semibold">Invite members</p>
				<p className="text-xs text-muted-foreground">
					Learn more about{' '}
					<Link href="/pricing" className="text-violet-500 hover:underline">
						workspace roles
					</Link>{' '}
					and{' '}
					<Link href="/pricing" className="text-violet-500 hover:underline">
						pricing
					</Link>
					.
				</p>
			</div>
			<form action={formAction} className="flex gap-2">
				<input type="hidden" name="workspaceId" value={workspaceId} />
				<Input
					name="email"
					type="email"
					placeholder="Email address..."
					className="flex-1"
					required
				/>
				<Select name="role" defaultValue="admin">
					<SelectTrigger className="w-36">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="admin">Admin</SelectItem>
						{!isPaid && (
							<>
								<SelectSeparator />
								<div className="px-2 py-1.5">
									<Link href="/pricing" className="text-xs text-gradient hover:underline">
										Unlock all roles
									</Link>
								</div>
								<SelectSeparator />
							</>
						)}
						<SelectItem value="editor" disabled={!isPaid}>
							Editor
						</SelectItem>
						<SelectItem value="viewer" disabled={!isPaid}>
							Viewer
						</SelectItem>
					</SelectContent>
				</Select>
				<Button type="submit" disabled={isPending}>
					{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invite member'}
				</Button>
			</form>
		</div>
	)
}
