import { randomUUID } from 'node:crypto'
import { Data, Effect, Option } from 'effect'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { AppRuntime } from '../../../runtime/AppRuntime.ts'
import { runHandler } from '../../../runtime/ErrorHandler.ts'
import { RedisConnection } from '../../../runtime/Redis.ts'
import { type SheetGenerationJobPayload, SheetJobQueue } from '../jobs/SheetGenerationJob.ts'
import {
  GenerateSheetRequestSchema,
  GenerateSheetResponseSchema,
  type SheetJobResult,
  SheetJobResultSchema,
} from '../schemas/sheetSchemas.ts'
import { SheetJobRepository } from '../services/SheetJobRepository.ts'

export class QueueUnavailable extends Data.TaggedError('QueueUnavailable')<{
  readonly cause: unknown
}> {}

/**
 * BullMQ waits for a Redis connection indefinitely before running a command, so an
 * enqueue during a Redis outage would hang the request. Past this bound it is a 503.
 */
export const ENQUEUE_TIMEOUT = '5 seconds'
const CACHE_READ_TIMEOUT = '1 second'

const jobIdParamsSchema = z.object({ jobId: z.string() })
const cacheKey = (jobId: string) => `sheet-job:${jobId}`

export function registerSheetRoutes(app: FastifyInstance, runtime: AppRuntime): void {
  const typed = app.withTypeProvider<ZodTypeProvider>()

  typed.route({
    method: 'POST',
    url: '/sheets/generate',
    schema: {
      body: GenerateSheetRequestSchema,
      response: { 202: GenerateSheetResponseSchema },
      tags: ['sheets'],
    },
    handler: async (request, reply) => {
      const { prompt, sourceUrl } = request.body
      const result = await runHandler(
        runtime,
        request,
        Effect.gen(function* () {
          const repository = yield* SheetJobRepository
          const queue = yield* SheetJobQueue
          const jobId = randomUUID()
          const correlationId = randomUUID()

          // Postgres first - it is the source of truth if Redis/BullMQ is unavailable.
          yield* repository.create(jobId, prompt, sourceUrl)
          yield* Effect.tryPromise({
            try: () =>
              queue.add('generate', {
                jobId,
                prompt,
                sourceUrl,
                correlationId,
              } satisfies SheetGenerationJobPayload),
            catch: (cause) => new QueueUnavailable({ cause }),
          }).pipe(
            Effect.timeoutOrElse({
              duration: ENQUEUE_TIMEOUT,
              orElse: () =>
                Effect.fail(
                  new QueueUnavailable({ cause: new Error('Timed out enqueueing sheet job') }),
                ),
            }),
          )
          return { jobId }
        }).pipe(Effect.withSpan('POST /sheets/generate')),
      )
      return reply.status(202).send(result)
    },
  })

  typed.route({
    method: 'GET',
    url: '/sheets/jobs/:jobId',
    schema: {
      params: jobIdParamsSchema,
      response: { 200: SheetJobResultSchema },
      tags: ['sheets'],
    },
    handler: async (request, reply) => {
      const { jobId } = request.params
      const result = await runHandler(
        runtime,
        request,
        Effect.gen(function* () {
          const redis = yield* RedisConnection
          const repository = yield* SheetJobRepository

          const cached = yield* Effect.tryPromise(() => redis.get(cacheKey(jobId))).pipe(
            Effect.timeout(CACHE_READ_TIMEOUT),
            Effect.catch(() => Effect.succeed(null)),
          )
          if (cached) {
            return JSON.parse(cached) as SheetJobResult
          }

          const job = yield* repository.findById(jobId)
          if (Option.isNone(job)) {
            return { jobId, status: 'pending' } satisfies SheetJobResult
          }

          const row = job.value
          const built: SheetJobResult = {
            jobId: row.id,
            status: row.status as SheetJobResult['status'],
            ...(row.result ? { sheet: row.result } : {}),
            ...(row.error ? { error: row.error } : {}),
          }
          yield* Effect.tryPromise(() =>
            redis.set(cacheKey(jobId), JSON.stringify(built), 'EX', 3600),
          ).pipe(Effect.catch(() => Effect.void))
          return built
        }).pipe(Effect.withSpan('GET /sheets/jobs/:jobId')),
      )
      return reply.send(result)
    },
  })
}
