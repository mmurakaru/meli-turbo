'use client'

import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Separator } from '@workspace/ui/components/separator'
import { toast } from '@workspace/ui/components/sonner'
import { Building2, Loader2 } from 'lucide-react'
import { useActionState, useEffect } from 'react'
import type { ActionState } from '@/lib/auth/middleware'
import { createWorkspace } from '../../actions'

export default function NewWorkspacePage() {
	const [state, formAction, isPending] = useActionState<ActionState, FormData>(createWorkspace, {
		error: '',
		success: '',
	})

	useEffect(() => {
		if (state?.error) {
			toast.error(state.error)
		}
	}, [state])

	return (
		<div className="h-full grid place-items-center">
			<div className="w-full max-w-[750px] border rounded-lg overflow-hidden">
				<div className="p-3">
					<div className="flex items-center gap-1.5 text-foreground">
						<Badge variant="secondary" className="flex gap-1.5 py-1 text-xs font-normal">
							<Building2 className="size-3 stroke-violet-500" strokeWidth={1} />
							Workspace
						</Badge>
					</div>
				</div>
				<form action={formAction}>
					<div className="grid px-3 pb-3">
						<Label htmlFor="name" className="sr-only">
							Name
						</Label>
						<Input
							id="name"
							name="name"
							placeholder="Workspace name"
							className="font-semibold"
							variant="ghost"
							required
							autoFocus
						/>
					</div>
					<Separator />
					<div className="flex justify-end p-3">
						<Button size="sm" type="submit" disabled={isPending}>
							{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create workspace'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}
