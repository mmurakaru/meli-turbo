import type { SqlError } from '@effect/sql'
import { eq } from 'drizzle-orm'
import { Context, Effect, Layer, Option } from 'effect'
import { type SheetJobRecord, sheetJob } from '../../../db/schema/sheetJob.ts'
import { PgDrizzle } from '../../../runtime/Database.ts'
import type { Sheet } from '../schemas/sheetSchemas.ts'

// drizzle-orm 0.45.x carries duplicate PgColumn declarations that @effect/sql-drizzle
// rejects (Effect-TS/effect#5904); the documented workaround is to widen the table
// reference at the call sites until the peer range moves past drizzle-orm 0.50.
// biome-ignore lint/suspicious/noExplicitAny: see Effect-TS/effect#5904
const table = sheetJob as any
// biome-ignore lint/suspicious/noExplicitAny: see Effect-TS/effect#5904
const whereId = (id: string): any => eq(sheetJob.id, id)

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

export class SheetJobRepository extends Context.Tag('SheetJobRepository')<
  SheetJobRepository,
  SheetJobRepositoryService
>() {}

export const SheetJobRepositoryLive = Layer.effect(
  SheetJobRepository,
  Effect.gen(function* () {
    const db = yield* PgDrizzle.PgDrizzle
    return {
      create: (jobId, prompt, sourceUrl) =>
        db
          .insert(table)
          .values({ id: jobId, status: 'pending', prompt, sourceUrl: sourceUrl ?? null })
          .pipe(Effect.asVoid),
      setProcessing: (jobId) =>
        db
          .update(table)
          .set({ status: 'processing', updatedAt: new Date() })
          .where(whereId(jobId))
          .pipe(Effect.asVoid),
      setCompleted: (jobId, sheet) =>
        db
          .update(table)
          .set({ status: 'completed', result: sheet, updatedAt: new Date() })
          .where(whereId(jobId))
          .pipe(Effect.asVoid),
      setFailed: (jobId, error) =>
        db
          .update(table)
          .set({ status: 'failed', error, updatedAt: new Date() })
          .where(whereId(jobId))
          .pipe(Effect.asVoid),
      findById: (jobId) =>
        db
          .select()
          .from(table)
          .where(whereId(jobId))
          .limit(1)
          .pipe(Effect.map((rows) => Option.fromNullable(rows[0] as SheetJobRecord | undefined))),
    }
  }),
)
