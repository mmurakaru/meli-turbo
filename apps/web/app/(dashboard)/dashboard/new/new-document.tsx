'use client'

import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@workspace/ui/components/dialog'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group'
import { Separator } from '@workspace/ui/components/separator'
import { Switch } from '@workspace/ui/components/switch'
import { toast } from '@workspace/ui/components/sonner'
import { Textarea } from '@workspace/ui/components/textarea'
import useAutosizeTextArea from '@workspace/ui/hooks/use-auto-size-textarea'
import { Check, Columns3, Copy, Loader2 } from 'lucide-react'
import { useActionState, useEffect, useRef, useState } from 'react'
import { v7 as uuidv7 } from 'uuid'
import type { ActionState } from '@/lib/auth/middleware'
import type { Workspace } from '@/lib/db/schema'
import { createDocument } from '../../actions'

export function NewDocument({ workspace }: { workspace: Workspace | null }) {
	const [formKey, setFormKey] = useState(0)
	const [documentId, setDocumentId] = useState(() => uuidv7())
	const [description, setDescription] = useState('')
	const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('private')
	const [createMore, setCreateMore] = useState(false)
	const [copied, setCopied] = useState(false)
	const textAreaRef = useRef<HTMLTextAreaElement>(null)
	useAutosizeTextArea(textAreaRef.current, description)

	const [createState, createAction, isCreatePending] = useActionState<ActionState, FormData>(
		createDocument,
		{ error: '', success: '' },
	)

	useEffect(() => {
		if (createState?.error) {
			toast.error(createState.error)
		}
		if (createState?.success) {
			toast.success(createState.success)
			setDocumentId(uuidv7())
			setDescription('')
			setSelectedWorkspaceId('private')
			setFormKey((k) => k + 1)
		}
	}, [createState])

	function copyToClipboard() {
		navigator.clipboard.writeText(`${window.location.origin}/document/${documentId}`)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<section className="h-full">
			<div className="h-full grid place-items-center">
				<div>
					<h1 className="text-lg lg:text-2xl font-extrabold mb-2">Create new spreadsheet</h1>
					<p className="mb-4 text-sm">
						Describe what you need in plain language and Meli generates an editable spreadsheet.{' '}
						<br />
						Get started by giving your spreadsheet a title.
					</p>
					<Dialog>
						<DialogTrigger asChild>
							<Button size="sm">Create spreadsheet</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[750px] p-0 gap-0" aria-describedby={undefined}>
							<DialogHeader className="p-3">
								<div className="flex items-center gap-1.5 text-foreground">
									<Badge variant="secondary" className="flex gap-1.5 py-1 text-xs font-normal">
										<Columns3 className="size-3 stroke-violet-500" strokeWidth={1} />
										Spreadsheet
									</Badge>
									<DialogTitle className="sr-only" />
								</div>
							</DialogHeader>
							<form key={formKey} action={createAction}>
								<input type="hidden" name="id" value={documentId} />
								{createMore && <input type="hidden" name="createMore" value="true" />}
								<div className="grid px-3 pb-3">
									<Label htmlFor="title" className="sr-only">
										Title
									</Label>
									<Input
										name="title"
										placeholder="Spreadsheet title"
										className="font-semibold"
										variant="ghost"
										required
									/>
									<Label htmlFor="description" className="sr-only">
										Description
									</Label>
									<Textarea
										name="description"
										placeholder="Add description..."
										className="max-h-[400px]"
										variant="ghost"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										ref={textAreaRef}
										rows={1}
									/>
									<RadioGroup
										className="px-3"
										defaultValue="private"
										name="owner"
										onValueChange={setSelectedWorkspaceId}
									>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="private" id="r-private" />
											<Label htmlFor="r-private">Private</Label>
										</div>
										{workspace && (
										<div className="flex items-center space-x-2">
											<RadioGroupItem value={workspace.id} id="r-workspace" />
											<Label htmlFor="r-workspace">Workspace</Label>
										</div>
									)}
									</RadioGroup>
									{selectedWorkspaceId !== 'private' && workspace && (
										<input type="hidden" name="workspaceId" value={workspace.id} />
									)}
									<div className="flex items-center gap-2 mt-4">
										<div className="grid flex-1">
											<Label htmlFor="sheet-url" className="sr-only">
												Sheet URL
											</Label>
											<Input
												id="sheet-url"
												value={`${typeof window !== 'undefined' ? window.location.origin : ''}/document/${documentId}`}
												readOnly
												className="text-xs text-muted-foreground"
											/>
										</div>
										<Button
											type="button"
											size="icon"
											variant="secondary"
											onClick={copyToClipboard}
										>
											<span className="sr-only">{copied ? 'Copied!' : 'Copy URL'}</span>
											{copied ? <Check strokeWidth={1} /> : <Copy strokeWidth={1} />}
										</Button>
									</div>
								</div>
								<Separator />
								<DialogFooter className="gap-1 p-3 sm:justify-between">
									<div className="flex items-center gap-2">
										<Switch
											id="create-more"
											checked={createMore}
											onCheckedChange={setCreateMore}
										/>
										<Label
											htmlFor="create-more"
											className="font-normal text-xs text-muted-foreground"
										>
											Create more
										</Label>
									</div>
									<Button size="sm" type="submit" disabled={isCreatePending}>
										{isCreatePending ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											'Create spreadsheet'
										)}
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</section>
	)
}
