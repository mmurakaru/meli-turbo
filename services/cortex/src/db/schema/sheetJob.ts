import { jsonb, pgSchema, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod/v4'
import type { Sheet } from '../../modules/sheets/schemas/sheetSchemas.ts'

export const sheetSchema = pgSchema('sheet')

export const sheetJob = sheetSchema.table('sheet_jobs', {
  id: varchar('id').primaryKey(),
  status: varchar('status', { length: 20 }).notNull(),
  prompt: text('prompt').notNull(),
  sourceUrl: varchar('source_url'),
  result: jsonb('result').$type<Sheet>(),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const selectSheetJobSchema = createSelectSchema(sheetJob)
export type SheetJobRecord = z.infer<typeof selectSheetJobSchema>

export const insertSheetJobSchema = createInsertSchema(sheetJob)
export type NewSheetJobRecord = z.infer<typeof insertSheetJobSchema>
