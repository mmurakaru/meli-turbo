import type { ModuleAwareQueueManager } from '@lokalise/background-jobs-common'
import { buildFastifyRoute } from '@lokalise/fastify-api-contracts'
import { generateUuid7 } from '@lokalise/id-utils'
import { randomUUID } from 'node:crypto'
import type { Redis } from 'ioredis'
import { AbstractController, type BuildRoutesReturnType } from 'opinionated-machine'
import type { BullmqSupportedQueues } from '../../../infrastructure/CommonModule.ts'
import {
  SheetGenerationJob,
  type SheetGenerationJobPayload,
} from '../job-queue-processors/SheetGenerationJob.ts'
import type { SheetsInjectableDependencies } from '../SheetModule.ts'
import { getSheetJobContract, postGenerateSheetContract } from '../schemas/sheetApiContracts.ts'

type SheetControllerContractsType = typeof SheetController.contracts

export class SheetController extends AbstractController<SheetControllerContractsType> {
  public static contracts = {
    generateSheet: postGenerateSheetContract,
    getSheetJob: getSheetJobContract,
  } as const

  private readonly redis: Redis
  private readonly bullmqQueueManager: ModuleAwareQueueManager<BullmqSupportedQueues>

  constructor(dependencies: SheetsInjectableDependencies) {
    super()
    this.redis = dependencies.redis
    this.bullmqQueueManager = dependencies.bullmqQueueManager
  }

  private generateSheet = buildFastifyRoute(postGenerateSheetContract, async (req, reply) => {
    const { prompt, sourceUrl } = req.body
    const jobId = generateUuid7()

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

    const raw = await this.redis.get(resultKey)
    if (!raw) {
      return reply.send({ jobId, status: 'pending' as const })
    }

    const result = JSON.parse(raw)
    return reply.send(result)
  })

  buildRoutes(): BuildRoutesReturnType<SheetControllerContractsType> {
    return {
      generateSheet: this.generateSheet,
      getSheetJob: this.getSheetJob,
    }
  }
}
