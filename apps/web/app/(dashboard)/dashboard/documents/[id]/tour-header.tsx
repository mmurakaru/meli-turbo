'use client'

import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { toast } from '@workspace/ui/components/sonner'
import { useActionState, useEffect } from 'react'
import { updateDocument } from '@/app/(dashboard)/actions'
import type { ActionState } from '@/lib/auth/middleware'

export function TourHeader({
	tourId,
	title,
	description,
}: {
	tourId: number
	title: string
	description: string
}) {
	const [updateState, updateAction] = useActionState<ActionState, FormData>(updateDocument, {
		error: '',
		success: '',
	})

	useEffect(() => {
		if (updateState?.error) {
			toast.error(updateState.error)
		}
		if (updateState?.success) {
			toast.success(updateState.success)
		}
	}, [updateState])

	return (
		<div>
			<form action={updateAction}>
				<input type="hidden" name="tourId" value={tourId} />
				<Label htmlFor="title" className="sr-only">
					Title
				</Label>
				<Input
					variant="ghost"
					className="text-lg lg:text-2xl font-extrabold"
					required
					placeholder="Spreadsheet title"
					defaultValue={title || ''}
				/>
				<Label htmlFor="description" className="sr-only">
					Description
				</Label>
				<Input
					placeholder="Add description..."
					name="description"
					variant="ghost"
					className="text-sm"
					defaultValue={description || ''}
					required
				/>
			</form>
		</div>
	)
}
