import { randomUUID } from 'node:crypto'
import type { ModuleAwareQueueManager } from '@lokalise/background-jobs-common'
import { buildFastifyRoute } from '@lokalise/fastify-api-contracts'
import { generateUuid7 } from '@lokalise/id-utils'
import type { Redis } from 'ioredis'
import { AbstractController, type BuildRoutesReturnType } from 'opinionated-machine'
import type { BullmqSupportedQueues } from '../../../infrastructure/CommonModule.ts'
import {
  SheetGenerationJob,
  type SheetGenerationJobPayload,
} from '../job-queue-processors/SheetGenerationJob.ts'
import type { SheetsInjectableDependencies } from '../SheetModule.ts'
import { getSheetJobContract, postGenerateSheetContract } from '../schemas/sheetApiContracts.ts'
import type { SheetJobResult } from '../schemas/sheetSchemas.ts'
import type { SheetJobRepository } from '../services/SheetJobRepository.ts'

type SheetControllerContractsType = typeof SheetController.contracts

export class SheetController extends AbstractController<SheetControllerContractsType> {
  public static contracts = {
    generateSheet: postGenerateSheetContract,
    getSheetJob: getSheetJobContract,
  } as const

  private readonly redis: Redis
  private readonly bullmqQueueManager: ModuleAwareQueueManager<BullmqSupportedQueues>
  private readonly sheetJobRepository: SheetJobRepository

  constructor(dependencies: SheetsInjectableDependencies) {
    super()
    this.redis = dependencies.redis
    this.bullmqQueueManager = dependencies.bullmqQueueManager
    this.sheetJobRepository = dependencies.sheetJobRepository
  }

  private generateSheet = buildFastifyRoute(postGenerateSheetContract, async (req, reply) => {
    const { prompt, sourceUrl } = req.body
    const jobId = generateUuid7()

    // Write to Postgres first — source of truth if Redis is unavailable
    await this.sheetJobRepository.create(jobId, prompt, sourceUrl)

    await this.bullmqQueueManager.schedule(SheetGenerationJob.QUEUE_ID, {
      metadata: { correlationId: randomUUID() },
      jobId,
      prompt,
      sourceUrl,
    } as SheetGenerationJobPayload)

    return reply.status(202).send({ jobId })
  })

  private getSheetJob = buildFastifyRoute(getSheetJobContract, async (req, reply) => {
    const { jobId } = req.params
    const resultKey = `sheet-job:${jobId}`

    // Fast path: Redis cache hit
    const raw = await this.redis.get(resultKey)
    if (raw) {
      return reply.send(JSON.parse(raw))
    }

    // Fallback: query Postgres (handles Redis restarts / TTL expiry)
    const job = await this.sheetJobRepository.findById(jobId)
    if (!job) {
      return reply.send({ jobId, status: 'pending' as const })
    }

    const result = {
      jobId: job.id,
      // DB column is a plain string; repository only ever writes the contract's enum values
      status: job.status as SheetJobResult['status'],
      ...(job.result ? { sheet: job.result } : {}),
      ...(job.error ? { error: job.error } : {}),
    }

    // Re-populate Redis cache for subsequent polls
    await this.redis.set(resultKey, JSON.stringify(result), 'EX', 3600)

    return reply.send(result)
  })

  buildRoutes(): BuildRoutesReturnType<SheetControllerContractsType> {
    return {
      generateSheet: this.generateSheet,
      getSheetJob: this.getSheetJob,
    }
  }
}
