'use client'

import { Avatar, AvatarFallback } from '@workspace/ui/components/avatar'
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
import { Separator } from '@workspace/ui/components/separator'
import { Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRef, useActionState, useState } from 'react'
import type { ActionState } from '@/lib/auth/middleware'
import type { WorkspaceDataWithMembers } from '@/lib/db/schema'
import { customerPortalAction } from '@/lib/payments/actions'
import { deleteWorkspace } from '../../actions'

export function Settings({
	workspaceData,
	documentCount,
}: {
	workspaceData: WorkspaceDataWithMembers
	documentCount: number
}) {
	const [open, setOpen] = useState(false)
	const formRef = useRef<HTMLFormElement>(null)
	const [deleteState, deleteAction, isDeletePending] = useActionState<ActionState, FormData>(
		deleteWorkspace,
		{ error: '', success: '' },
	)

	const memberCount = workspaceData.workspaceMembers.length

	return (
		<section className="flex-1">
			<h1 className="text-lg lg:text-2xl font-extrabold mb-6">Workspace Settings</h1>
			<Card className="mb-4">
				<CardHeader>
					<CardTitle>Subscription</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
						<div className="mb-4 sm:mb-0">
							<p className="text-sm font-medium text-gradient">
								Current Plan: {workspaceData.planName || 'Free'}
							</p>
							<p className="text-xs text-muted-foreground">
								{workspaceData.subscriptionStatus === 'active'
									? 'Billed monthly'
									: workspaceData.subscriptionStatus === 'trialing'
										? 'Trial period'
										: 'No active subscription'}
							</p>
						</div>
						<form action={customerPortalAction}>
							<Button type="submit" variant="secondary" size="sm">
								Manage Subscription
							</Button>
						</form>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-semibold text-sm">Delete Workspace</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								Workspace deletion is non-reversable. Please proceed with caution.
							</p>
						</div>
						<Button
							type="button"
							variant="destructive-outline"
							className="ml-6 shrink-0"
							size="sm"
							onClick={() => setOpen(true)}
						>
							Delete Workspace
						</Button>
					</div>
					{deleteState?.error && (
						<p className="text-red-500 text-xs mt-3">{deleteState.error}</p>
					)}
				</CardContent>
			</Card>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-md p-0 gap-0" aria-describedby={undefined}>
					<DialogHeader className="p-3">
						<div className="flex items-center gap-1.5 text-foreground">
							<Badge variant="secondary" className="flex gap-1.5 py-1 text-xs font-normal">
								<Trash2 className="size-3 stroke-red-500" strokeWidth={1} />
								Delete workspace
							</Badge>
							<DialogTitle className="sr-only">Permanently delete this workspace?</DialogTitle>
						</div>
					</DialogHeader>

					<div className="flex flex-col items-center px-3 pb-3 gap-1">
						<Avatar className="size-14 mb-2">
							<AvatarFallback className="bg-violet-500 text-white text-xl font-semibold">
								{workspaceData.name[0].toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<p className="text-lg font-bold">{workspaceData.name}</p>
						<p className="text-sm text-muted-foreground">
							{memberCount} {memberCount === 1 ? 'member' : 'members'}
						</p>
						<p className="text-sm text-muted-foreground">
							{documentCount} {documentCount === 1 ? 'document' : 'documents'}
						</p>
						<p className="text-sm text-center mt-2">
							You and everyone else in this workspace will lose access to all content. This cannot be
							undone.{' '}
							<Link href="/pricing" className="text-violet-500 hover:underline">
								Learn more
							</Link>
						</p>
					</div>

					<form ref={formRef} action={deleteAction}>
						<input type="hidden" name="workspaceId" value={workspaceData.id} />
					</form>

					<Separator />
					<DialogFooter className="gap-2 p-3 sm:justify-end">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setOpen(false)}
						>
							Keep workspace
						</Button>
						<Button
							type="button"
							variant="destructive"
							size="sm"
							className="bg-red-600 hover:bg-red-700"
							disabled={isDeletePending}
							onClick={() => formRef.current?.requestSubmit()}
						>
							{isDeletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	)
}
