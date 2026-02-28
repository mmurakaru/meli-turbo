'use client'

import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group'
import { Loader2 } from 'lucide-react'
import { useActionState } from 'react'
import { inviteTeamMember } from '@/app/(login)/actions'
import { useUser } from '@/lib/auth'

type ActionState = {
	error?: string
	success?: string
}

export function InviteMember() {
	const { user } = useUser()
	const isOwner = user?.role === 'owner'
	const [inviteState, inviteAction, isInvitePending] = useActionState<ActionState, FormData>(
		inviteTeamMember,
		{
			error: '',
			success: '',
		},
	)

	return (
		<Card>
			<CardHeader>
				<CardTitle>Invite Member</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={inviteAction} className="space-y-4">
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="Enter email"
							required
							disabled={!isOwner}
						/>
					</div>
					<div className="grid gap-2">
						<Label>Role</Label>
						<RadioGroup
							defaultValue="member"
							name="role"
							className="flex space-x-4"
							disabled={!isOwner}
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="member" id="member" />
								<Label htmlFor="member" className="font-normal text-xs text-muted-foreground">
									Member
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="owner" id="owner" />
								<Label htmlFor="owner" className="font-normal text-xs text-muted-foreground">
									Owner
								</Label>
							</div>
						</RadioGroup>
					</div>
					{inviteState?.error && <p className="text-red-500">{inviteState.error}</p>}
					{inviteState?.success && <p className="text-green-500">{inviteState.success}</p>}
					<Button
						type="submit"
						disabled={isInvitePending || !isOwner}
						variant={'secondary'}
						size="sm"
					>
						{isInvitePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Invite Member</>}
					</Button>
				</form>
			</CardContent>
			{!isOwner && (
				<CardFooter>
					<p className="text-sm text-muted-foreground">
						You must be a team owner to invite new members.
					</p>
				</CardFooter>
			)}
		</Card>
	)
}
