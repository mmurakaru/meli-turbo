import { createOpenAI } from '@ai-sdk/openai'
import { generateText, Output } from 'ai'
import { Context, Data, Effect, Layer, Redacted, Schedule } from 'effect'
import { z } from 'zod'
import { fetchSource } from '../../../integrations/WebFetcherService.ts'
import { AppConfig } from '../../../runtime/config.ts'
import type { Sheet } from '../schemas/sheetSchemas.ts'

export class AiGenerationError extends Data.TaggedError('AiGenerationError')<{
  readonly reason: string
}> {}

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

const SYSTEM_PROMPT = `You are a spreadsheet generator. Given a natural language prompt and optional source content,
produce a structured spreadsheet with appropriate columns and rows.
Rules:
- Column ids must be simple strings like "col-1", "col-2", etc.
- Row objects must use column ids as keys
- Keep text concise and useful
- Generate at minimum 1 column and 1 row`

const GENERATION_TIMEOUT = '120 seconds'
// Exponential backoff (1s, 2s), at most 2 retries: recur while both schedules recur,
// waiting the larger delay (Effect 3's `compose` of the same two schedules).
const RETRY_POLICY = Schedule.max([Schedule.exponential('1 second'), Schedule.recurs(2)])

export type SheetServiceApi = {
  readonly generateSheet: (
    prompt: string,
    sourceUrl?: string,
  ) => Effect.Effect<Sheet, AiGenerationError>
}

export class SheetService extends Context.Service<SheetService, SheetServiceApi>()(
  'SheetService',
) {}

export const SheetServiceLive = Layer.effect(
  SheetService,
  Effect.gen(function* () {
    const config = yield* AppConfig
    const openai = createOpenAI({
      baseURL: config.ai.baseUrl,
      apiKey: Redacted.value(config.ai.apiKey),
    })

    const buildContextBlock = (sourceUrl?: string) =>
      sourceUrl === undefined
        ? Effect.succeed('')
        : fetchSource(sourceUrl).pipe(
            Effect.map(
              (fetched) =>
                `\n\nSource content (${fetched.contentType}) from ${sourceUrl}:\n${fetched.body.slice(0, 8_000)}`,
            ),
            // A source-fetch failure is non-fatal: continue without the context.
            Effect.catchTag('SourceFetchError', (error) =>
              Effect.logWarning('Source fetch failed, continuing without context').pipe(
                Effect.annotateLogs('sourceUrl', sourceUrl),
                Effect.annotateLogs('reason', error.reason),
                Effect.as(''),
              ),
            ),
          )

    return {
      generateSheet: (prompt, sourceUrl) =>
        Effect.gen(function* () {
          const contextBlock = yield* buildContextBlock(sourceUrl)
          const { output } = yield* Effect.tryPromise({
            try: () =>
              generateText({
                model: openai(config.ai.model),
                output: Output.object({ schema: AI_SHEET_SCHEMA }),
                system: SYSTEM_PROMPT,
                prompt: `Create a spreadsheet for: ${prompt}${contextBlock}`,
              }),
            catch: (cause) => new AiGenerationError({ reason: String(cause) }),
          }).pipe(
            Effect.timeout(GENERATION_TIMEOUT),
            Effect.retry({
              schedule: RETRY_POLICY,
              while: (error) => error instanceof AiGenerationError,
            }),
            Effect.catchTag('TimeoutError', () =>
              Effect.fail(
                new AiGenerationError({
                  reason: `Generation timed out after ${GENERATION_TIMEOUT}`,
                }),
              ),
            ),
          )
          return output as Sheet
        }).pipe(Effect.withSpan('SheetService.generateSheet')),
    }
  }),
)
