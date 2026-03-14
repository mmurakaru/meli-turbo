import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { documents, modules, steps, type DocumentWithModules, teams } from '@/lib/db/schema'

interface Params {
	id: string
}

export async function GET(_request: NextRequest, { params }: { params: Promise<Params> }) {
	const { id } = await params

	try {
		const tourConfig = await db
			.select({
				id: documents.id,
				title: documents.title,
				description: documents.description,
				ownerId: documents.ownerId,
				ownerType: documents.ownerType,
				teamName: teams.name,
				modules: modules,
				steps: steps,
				createdAt: documents.createdAt,
				updatedAt: documents.updatedAt,
				deletedAt: documents.deletedAt,
			})
			.from(documents)
			.innerJoin(teams, eq(documents.ownerId, teams.id))
			.leftJoin(modules, eq(documents.id, modules.tourId))
			.leftJoin(steps, eq(modules.id, steps.moduleId))
			.where(eq(documents.id, +id))

		if (tourConfig.length === 0) {
			return NextResponse.json({ error: 'Document configuration not found.' }, { status: 404 })
		}

		const tour = tourConfig.reduce<DocumentWithModules | null>((acc, curr) => {
			if (!acc) {
				acc = {
					id: curr.id,
					title: curr.title,
					description: curr.description,
					ownerId: curr.ownerId,
					ownerType: curr.ownerType,
					createdAt: curr.createdAt,
					updatedAt: curr.updatedAt,
					deletedAt: curr.deletedAt,
					modules: [],
				}
			}

			let module = acc.modules.find((m) => m.id === curr.modules?.id)
			if (curr.modules && !module) {
				module = {
					id: curr.modules.id,
					tourId: curr.modules.tourId,
					title: curr.modules.title,
					order: curr.modules.order,
					createdAt: curr.modules.createdAt,
					updatedAt: curr.modules.updatedAt,
					steps: [],
				}
				acc.modules.push(module)
			}

			if (curr.steps && module) {
				module.steps.push({
					id: curr.steps.id,
					moduleId: curr.steps.moduleId,
					selector: curr.steps.selector,
					title: curr.steps.title,
					text: curr.steps.text,
					order: curr.steps.order,
					createdAt: curr.steps.createdAt,
					updatedAt: curr.steps.updatedAt,
				})
			}

			return acc
		}, null)

		// Sort modules by order
		tour?.modules.sort((a, b) => a.order - b.order)

		// Sort steps within each module
		tour?.modules.forEach((module) => {
			module.steps.sort((a, b) => a.order - b.order)
		})

		return NextResponse.json(tour, { status: 200 })
	} catch (_error) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
	}
}
