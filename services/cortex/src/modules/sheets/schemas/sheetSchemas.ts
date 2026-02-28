import { z } from 'zod'

export const SheetColumnSchema = z.object({
  id: z.string(),
  label: z.string(),
})

export const SheetRowSchema = z.record(z.string(), z.string())

export const SheetSchema = z.object({
  columns: z.array(SheetColumnSchema),
  rows: z.array(SheetRowSchema),
})

export const GenerateSheetRequestSchema = z.object({
  prompt: z.string().min(1).describe('Natural language description of the desired spreadsheet'),
  sourceUrl: z
    .string()
    .url()
    .optional()
    .describe('Optional URL to fetch source data from (sitemap, page, JSON, etc.)'),
})

export const GenerateSheetResponseSchema = z.object({
  jobId: z.string().describe('Background job ID for polling generation status'),
})

export const SheetJobResultSchema = z.object({
  jobId: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  sheet: SheetSchema.optional(),
  error: z.string().optional(),
})

export type SheetColumn = z.infer<typeof SheetColumnSchema>
export type SheetRow = z.infer<typeof SheetRowSchema>
export type Sheet = z.infer<typeof SheetSchema>
export type GenerateSheetRequest = z.infer<typeof GenerateSheetRequestSchema>
export type GenerateSheetResponse = z.infer<typeof GenerateSheetResponseSchema>
export type SheetJobResult = z.infer<typeof SheetJobResultSchema>
