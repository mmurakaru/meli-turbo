import { eq } from 'drizzle-orm'
import { Context, Effect, Layer, Option } from 'effect'
import type { SqlError } from 'effect/sql'
import { type SheetJobRecord, sheetJob } from '../../../db/schema/sheetJob.ts'
import { PgDrizzle } from '../../../runtime/Database.ts'
import type { Sheet } from '../schemas/sheetSchemas.ts'

const { runQuery } = PgDrizzle
const whereId = (id: string) => eq(sheetJob.id, id)

export type SheetJobRepositoryService = {
  readonly create: (
    jobId: string,
    prompt: string,
    sourceUrl?: string,
  ) => Effect.Effect<void, SqlError.SqlError>
  readonly setProcessing: (jobId: string) => Effect.Effect<void, SqlError.SqlError>
  readonly setCompleted: (jobId: string, sheet: Sheet) => Effect.Effect<void, SqlError.SqlError>
  readonly setFailed: (jobId: string, error: string) => Effect.Effect<void, SqlError.SqlError>
  readonly findById: (
    jobId: string,
  ) => Effect.Effect<Option.Option<SheetJobRecord>, SqlError.SqlError>
}

export class SheetJobRepository extends Context.Service<
  SheetJobRepository,
  SheetJobRepositoryService
>()('SheetJobRepository') {}

export const SheetJobRepositoryLive = Layer.effect(
  SheetJobRepository,
  Effect.gen(function* () {
    const db = yield* PgDrizzle.PgDrizzle
    return {
      create: (jobId, prompt, sourceUrl) =>
        runQuery(
          db
            .insert(sheetJob)
            .values({ id: jobId, status: 'pending', prompt, sourceUrl: sourceUrl ?? null }),
        ).pipe(Effect.asVoid),
      setProcessing: (jobId) =>
        runQuery(
          db
            .update(sheetJob)
            .set({ status: 'processing', updatedAt: new Date() })
            .where(whereId(jobId)),
        ).pipe(Effect.asVoid),
      setCompleted: (jobId, sheet) =>
        runQuery(
          db
            .update(sheetJob)
            .set({ status: 'completed', result: sheet, updatedAt: new Date() })
            .where(whereId(jobId)),
        ).pipe(Effect.asVoid),
      setFailed: (jobId, error) =>
        runQuery(
          db
            .update(sheetJob)
            .set({ status: 'failed', error, updatedAt: new Date() })
            .where(whereId(jobId)),
        ).pipe(Effect.asVoid),
      findById: (jobId) =>
        runQuery(db.select().from(sheetJob).where(whereId(jobId)).limit(1)).pipe(
          Effect.map((rows) => Option.fromNullishOr(rows[0] as SheetJobRecord | undefined)),
        ),
    }
  }),
)
