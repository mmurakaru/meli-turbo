import { eq } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { sheetJob } from '../../../db/schema/sheetJob.ts'
import type { Sheet } from '../schemas/sheetSchemas.ts'

type SheetJobRepositoryDeps = {
  drizzle: PostgresJsDatabase
}

export class SheetJobRepository {
  private readonly db: PostgresJsDatabase

  constructor({ drizzle }: SheetJobRepositoryDeps) {
    this.db = drizzle
  }

  async create(jobId: string, prompt: string, sourceUrl?: string): Promise<void> {
    await this.db.insert(sheetJob).values({
      id: jobId,
      status: 'pending',
      prompt,
      sourceUrl: sourceUrl ?? null,
    })
  }

  async setProcessing(jobId: string): Promise<void> {
    await this.db
      .update(sheetJob)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(sheetJob.id, jobId))
  }

  async setCompleted(jobId: string, sheet: Sheet): Promise<void> {
    await this.db
      .update(sheetJob)
      .set({ status: 'completed', result: sheet, updatedAt: new Date() })
      .where(eq(sheetJob.id, jobId))
  }

  async setFailed(jobId: string, error: string): Promise<void> {
    await this.db
      .update(sheetJob)
      .set({ status: 'failed', error, updatedAt: new Date() })
      .where(eq(sheetJob.id, jobId))
  }

  async findById(jobId: string) {
    const rows = await this.db
      .select()
      .from(sheetJob)
      .where(eq(sheetJob.id, jobId))
      .limit(1)

    return rows[0] ?? null
  }
}
