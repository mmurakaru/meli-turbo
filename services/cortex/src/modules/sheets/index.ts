import { Layer } from 'effect'
import { SheetJobQueueLive, SheetWorkerLive } from './jobs/SheetGenerationJob.ts'
import { SheetJobRepositoryLive } from './services/SheetJobRepository.ts'
import { SheetServiceLive } from './services/SheetService.ts'

/**
 * The sheets module. The repository and queue are public (the module's HTTP routes,
 * registered at the shell, consume them via the runtime). SheetService is used only
 * by the worker, so it is provided inward and stays module-private.
 */
export const SheetsModuleLive = Layer.mergeAll(
  SheetJobRepositoryLive,
  SheetJobQueueLive,
  SheetWorkerLive.pipe(Layer.provide(Layer.merge(SheetJobRepositoryLive, SheetServiceLive))),
)

export { registerSheetRoutes } from './http/sheetRoutes.ts'
export { SheetJobQueue } from './jobs/SheetGenerationJob.ts'
export { SheetJobRepository } from './services/SheetJobRepository.ts'
