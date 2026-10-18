import { type Job, Queue, Worker } from 'bullmq'
import { Context, Effect, Layer } from 'effect'
import type { Redis } from 'ioredis'
import { type ErrorReporter, reportFailures } from '../../../runtime/PostHog.ts'
import { BullConnection } from '../../../runtime/Queue.ts'
import { RedisConnection } from '../../../runtime/Redis.ts'
import type { Sheet } from '../schemas/sheetSchemas.ts'
import { SheetJobRepository } from '../services/SheetJobRepository.ts'
import { SheetService } from '../services/SheetService.ts'

export const SHEET_QUEUE_NAME = 'SheetGenerationJob'
const RESULT_CACHE_TTL_SECONDS = 3600

export type SheetGenerationJobPayload = {
  readonly jobId: string
  readonly prompt: string
  readonly sourceUrl?: string
  readonly correlationId: string
}

export class SheetJobQueue extends Context.Service<
  SheetJobQueue,
  Queue<SheetGenerationJobPayload>
>()('SheetJobQueue') {}

/** BullMQ queue producer, closed with the runtime scope. */
export const SheetJobQueueLive = Layer.effect(
  SheetJobQueue,
  Effect.gen(function* () {
    const bull = yield* BullConnection
    return yield* Effect.acquireRelease(
      Effect.sync(
        () =>
          new Queue<SheetGenerationJobPayload>(SHEET_QUEUE_NAME, {
            connection: bull.connection,
            prefix: bull.prefix,
            defaultJobOptions: {
              attempts: 3,
              backoff: { type: 'exponential', delay: 1000 },
              removeOnComplete: 100,
              removeOnFail: 1000,
            },
          }),
      ),
      (queue) => Effect.promise(() => queue.close().catch(() => undefined)),
    )
  }),
)

const cacheKey = (jobId: string) => `sheet-job:${jobId}`

/** Best-effort cache write; Postgres remains the source of truth, so failures here are swallowed. */
const writeCache = (redis: Redis, jobId: string, value: unknown) =>
  Effect.tryPromise(() =>
    redis.set(cacheKey(jobId), JSON.stringify(value), 'EX', RESULT_CACHE_TTL_SECONDS),
  ).pipe(
    Effect.asVoid,
    Effect.catch(() => Effect.void),
  )

/**
 * BullMQ worker consuming the sheet-generation queue. Each job runs as a full Effect
 * on the captured runtime. A generation failure is a terminal business outcome (job
 * marked failed, not retried); infra failures (db/cache) propagate so BullMQ retries.
 */
export const SheetWorkerLive: Layer.Layer<
  never,
  never,
  BullConnection | SheetService | SheetJobRepository | RedisConnection | ErrorReporter
> = Layer.effectDiscard(
  Effect.gen(function* () {
    const bull = yield* BullConnection
    const services = yield* Effect.context<
      SheetService | SheetJobRepository | RedisConnection | ErrorReporter
    >()

    const processJob = (payload: SheetGenerationJobPayload) =>
      Effect.gen(function* () {
        const repository = yield* SheetJobRepository
        const service = yield* SheetService
        const redis = yield* RedisConnection

        yield* repository.setProcessing(payload.jobId)
        yield* writeCache(redis, payload.jobId, { jobId: payload.jobId, status: 'processing' })

        yield* service.generateSheet(payload.prompt, payload.sourceUrl).pipe(
          Effect.flatMap((sheet: Sheet) =>
            repository.setCompleted(payload.jobId, sheet).pipe(
              Effect.andThen(
                writeCache(redis, payload.jobId, {
                  jobId: payload.jobId,
                  status: 'completed',
                  sheet,
                }),
              ),
              Effect.andThen(Effect.logInfo('Sheet generation completed')),
            ),
          ),
          Effect.catchTag('AiGenerationError', (error) =>
            repository.setFailed(payload.jobId, error.reason).pipe(
              Effect.andThen(
                writeCache(redis, payload.jobId, {
                  jobId: payload.jobId,
                  status: 'failed',
                  error: error.reason,
                }),
              ),
              Effect.andThen(
                Effect.logError('Sheet generation failed').pipe(
                  Effect.annotateLogs('reason', error.reason),
                ),
              ),
            ),
          ),
        )
      }).pipe(
        reportFailures,
        Effect.annotateLogs('jobId', payload.jobId),
        Effect.annotateLogs('correlationId', payload.correlationId),
        Effect.withSpan('SheetGenerationJob.process', {
          attributes: { 'sheetJob.id': payload.jobId, correlationId: payload.correlationId },
        }),
      )

    yield* Effect.acquireRelease(
      Effect.sync(
        () =>
          new Worker<SheetGenerationJobPayload>(
            SHEET_QUEUE_NAME,
            (job: Job<SheetGenerationJobPayload>) =>
              Effect.runPromiseWith(services)(processJob(job.data)),
            { connection: bull.connection, prefix: bull.prefix, concurrency: bull.concurrency },
          ),
      ),
      (worker) => Effect.promise(() => worker.close().catch(() => undefined)),
    )
  }),
)
