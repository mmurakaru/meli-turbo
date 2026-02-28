import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import type { Config } from '../../../infrastructure/config.ts'
import { WebFetcherService } from '../../../integrations/WebFetcherService.ts'
import type { Sheet } from '../schemas/sheetSchemas.ts'

type SheetServiceDeps = {
  config: Config
}

const AI_SHEET_SCHEMA = z.object({
  columns: z.array(
    z.object({
      id: z.string().describe('Unique column identifier e.g. col-1'),
      label: z.string().describe('Human-readable column header'),
    }),
  ),
  rows: z
    .array(z.record(z.string(), z.string()))
    .describe('Array of row objects where each key matches a column id'),
})

export class SheetService {
  private readonly webFetcher: WebFetcherService
  private readonly config: Config

  constructor({ config }: SheetServiceDeps) {
    this.config = config
    this.webFetcher = new WebFetcherService()
  }

  async generateSheet(prompt: string, sourceUrl?: string): Promise<Sheet> {
    let contextBlock = ''

    if (sourceUrl) {
      try {
        const fetched = await this.webFetcher.fetch(sourceUrl)
        const truncated = fetched.body.slice(0, 8_000)
        contextBlock = `\n\nSource content (${fetched.contentType}) from ${sourceUrl}:\n${truncated}`
      } catch {
        // non-fatal - continue without source context
      }
    }

    const aiConfig = this.config.ai
    const openai = createOpenAI({
      baseURL: aiConfig.baseUrl,
      apiKey: aiConfig.apiKey,
    })

    const systemPrompt = `You are a spreadsheet generator. Given a natural language prompt and optional source content, 
produce a structured spreadsheet with appropriate columns and rows.
Rules:
- Column ids must be simple strings like "col-1", "col-2", etc.
- Row objects must use column ids as keys
- Keep text concise and useful
- Generate at minimum 1 column and 1 row`

    const { object } = await generateObject({
      model: openai(aiConfig.model),
      schema: AI_SHEET_SCHEMA,
      system: systemPrompt,
      prompt: `Create a spreadsheet for: ${prompt}${contextBlock}`,
    })

    return object as Sheet
  }
}
