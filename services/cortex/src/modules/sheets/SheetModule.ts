import type { ModuleAwareQueueConfiguration } from '@lokalise/background-jobs-common'
import {
  AbstractModule,
  asControllerClass,
  asEnqueuedJobWorkerClass,
  asServiceClass,
  type DependencyInjectionOptions,
  type InferModuleDependencies,
  type InferPublicModuleDependencies,
  type MandatoryNameAndRegistrationPair,
  type PublicDependencies,
} from 'opinionated-machine'
import { SheetController } from './controllers/SheetController.ts'
import {
  SHEET_GENERATION_JOB_PAYLOAD,
  SheetGenerationJob,
} from './job-queue-processors/SheetGenerationJob.ts'
import { SheetService } from './services/SheetService.ts'

export type SheetsInjectableDependencies = SheetsModuleDependencies & PublicDependencies

export const sheetBullmqQueues = [
  {
    queueId: SheetGenerationJob.QUEUE_ID,
    moduleId: 'sheet',
    jobPayloadSchema: SHEET_GENERATION_JOB_PAYLOAD,
  },
] as const satisfies ModuleAwareQueueConfiguration[]

export class SheetModule extends AbstractModule {
  resolveDependencies(diOptions: DependencyInjectionOptions) {
    return {
      sheetService: asServiceClass(SheetService),

      sheetGenerationJob: asEnqueuedJobWorkerClass(SheetGenerationJob, {
        diOptions,
        queueName: SheetGenerationJob.QUEUE_ID,
      }),
    }
  }

  override resolveControllers(): MandatoryNameAndRegistrationPair<unknown> {
    return {
      sheetController: asControllerClass(SheetController),
    }
  }
}

export type SheetsModuleDependencies = InferModuleDependencies<SheetModule>

declare module 'opinionated-machine' {
  interface PublicDependencies extends InferPublicModuleDependencies<SheetModule> {}
}
