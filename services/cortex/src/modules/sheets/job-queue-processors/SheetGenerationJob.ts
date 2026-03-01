import { BASE_JOB_PAYLOAD_SCHEMA } from '@lokalise/background-jobs-common'
import type { RequestContext } from '@lokalise/fastify-extras'
import type { Job } from 'bullmq'
import type { Redis } from 'ioredis'
import z from 'zod/v4'
import { AbstractEnqueuedJobProcessor } from '../../../infrastructure/jobs/AbstractEnqueuedJobProcessor.ts'
import type { SheetsInjectableDependencies } from '../SheetModule.ts'
import type { SheetJobRepository } from '../services/SheetJobRepository.ts'
import type { SheetService } from '../services/SheetService.ts'

export const SHEET_GENERATION_JOB_PAYLOAD = BASE_JOB_PAYLOAD_SCHEMA.extend({
  jobId: z.string(),
  prompt: z.string(),
  sourceUrl: z.string().url().optional(),
})

export type SheetGenerationJobPayload = z.infer<typeof SHEET_GENERATION_JOB_PAYLOAD>

export class SheetGenerationJob extends AbstractEnqueuedJobProcessor<'SheetGenerationJob'> {
  public static readonly QUEUE_ID = 'SheetGenerationJob'

  private readonly sheetService: SheetService
  private readonly sheetJobRepository: SheetJobRepository
  private readonly redis: Redis

  constructor(dependencies: SheetsInjectableDependencies) {
    super(dependencies, {
      queueId: SheetGenerationJob.QUEUE_ID,
      workerOptions: { concurrency: 5 },
    })

    this.sheetService = dependencies.sheetService
    this.sheetJobRepository = dependencies.sheetJobRepository
    this.redis = dependencies.redis
  }

  protected async process(
    job: Job<SheetGenerationJobPayload>,
    requestContext: RequestContext,
  ): Promise<void> {
    const { jobId, prompt, sourceUrl } = job.data
    const resultKey = `sheet-job:${jobId}`

    await this.sheetJobRepository.setProcessing(jobId)
    await this.redis.set(resultKey, JSON.stringify({ jobId, status: 'processing' }), 'EX', 3600)

    try {
      const sheet = await this.sheetService.generateSheet(prompt, sourceUrl)

      await this.sheetJobRepository.setCompleted(jobId, sheet)
      await this.redis.set(
        resultKey,
        JSON.stringify({ jobId, status: 'completed', sheet }),
        'EX',
        3600,
      )

      requestContext.logger.info({ jobId }, 'Sheet generation completed')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      requestContext.logger.error({ jobId, err }, 'Sheet generation failed')

      await this.sheetJobRepository.setFailed(jobId, message)
      await this.redis.set(
        resultKey,
        JSON.stringify({ jobId, status: 'failed', error: message }),
        'EX',
        3600,
      )
    }
  }
}
