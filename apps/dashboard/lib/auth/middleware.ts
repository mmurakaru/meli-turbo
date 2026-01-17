import type { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import type { z } from 'zod'
import { getTeamForUser } from '@/lib/db/queries'
import type { TeamDataWithMembers } from '@/lib/db/schema'
import { createClient } from '@/utils/supabase/server'

export type ActionState = {
	error?: string
	success?: string
	// biome-ignore lint/suspicious/noExplicitAny: This allows for additional properties
	[key: string]: any
}

type ValidatedActionFunction<S extends z.ZodTypeAny, T> = (
	data: z.infer<S>,
	formData: FormData,
) => Promise<T>

export function validatedAction<S extends z.ZodTypeAny, T>(
	schema: S,
	action: ValidatedActionFunction<S, T>,
) {
	return async (_prevState: ActionState, formData: FormData): Promise<T> => {
		const result = schema.safeParse(Object.fromEntries(formData))
		if (!result.success) {
			return { error: result.error.errors[0].message } as T
		}

		return action(result.data, formData)
	}
}

type ValidatedActionWithUserFunction<S extends z.ZodTypeAny, T> = (
	data: z.infer<S>,
	formData: FormData,
	user: User,
) => Promise<T>

export function validatedActionWithUser<S extends z.ZodTypeAny, T>(
	schema: S,
	action: ValidatedActionWithUserFunction<S, T>,
) {
	return async (_prevState: ActionState, formData: FormData): Promise<T> => {
		const supabase = await createClient()

		const {
			error,
			data: { user },
		} = await supabase.auth.getUser()
		if (error || !user) {
			throw new Error('User is not authenticated')
		}

		const result = schema.safeParse(Object.fromEntries(formData))
		if (!result.success) {
			return { error: result.error.errors[0].message } as T
		}

		return action(result.data, formData, user)
	}
}

type ActionWithTeamFunction<T> = (formData: FormData, team: TeamDataWithMembers) => Promise<T>

export function withTeam<T>(action: ActionWithTeamFunction<T>) {
	return async (formData: FormData): Promise<T> => {
		const supabase = await createClient()

		const {
			error,
			data: { user },
		} = await supabase.auth.getUser()
		if (error || !user) {
			redirect('/sign-in')
		}

		const team = await getTeamForUser(user.id)
		if (!team) {
			throw new Error('Team not found')
		}

		return action(formData, team)
	}
}
