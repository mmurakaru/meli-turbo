'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar'
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { useActionState } from 'react'
import { removeTeamMember } from '@/app/(login)/actions'
import type { TeamDataWithMembers, User } from '@/lib/db/schema'
import { customerPortalAction } from '@/lib/payments/actions'
import { InviteMember } from './invite-member'

type ActionState = {
	error?: string
	success?: string
}

export function Settings({ teamData }: { teamData: TeamDataWithMembers }) {
	const [removeState, removeAction, isRemovePending] = useActionState<ActionState, FormData>(
		removeTeamMember,
		{
			error: '',
			success: '',
		},
	)

	const getUserDisplayName = (user: Pick<User, 'id' | 'name' | 'email'>) => {
		return user.name || user.email || 'Unknown User'
	}

	return (
		<section className="flex-1">
			<h1 className="text-lg lg:text-2xl font-extrabold mb-6">Workspace Settings</h1>
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Subscription</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
							<div className="mb-4 sm:mb-0">
								<p className="text-sm font-medium text-gradient">
									Current Plan: {teamData.planName || 'Free'}
								</p>
								<p className="text-xs text-muted-foreground">
									{teamData.subscriptionStatus === 'active'
										? 'Billed monthly'
										: teamData.subscriptionStatus === 'trialing'
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
					</div>
				</CardContent>
			</Card>
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Members</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="space-y-4">
						{teamData.teamMembers.map((member, index) => (
							<li key={member.id} className="flex items-center justify-between">
								<div className="flex items-center space-x-4">
									<Avatar>
										<AvatarImage className="h-8 w-8" alt={getUserDisplayName(member.user)} />
										<AvatarFallback>
											{getUserDisplayName(member.user)
												.split(' ')
												.map((n) => n[0])
												.join('')}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="font-normal text-sm">{getUserDisplayName(member.user)}</p>
										<p className="text-xs text-muted-foreground capitalize">{member.role}</p>
									</div>
								</div>
								{index > 1 ? (
									<form action={removeAction}>
										<input type="hidden" name="memberId" value={member.id} />
										<Button type="submit" variant="outline" size="sm" disabled={isRemovePending}>
											{isRemovePending ? 'Removing...' : 'Remove'}
										</Button>
									</form>
								) : null}
							</li>
						))}
					</ul>
					{removeState?.error && <p className="text-red-500 mt-4">{removeState.error}</p>}
				</CardContent>
			</Card>
			<InviteMember />
		</section>
	)
}
