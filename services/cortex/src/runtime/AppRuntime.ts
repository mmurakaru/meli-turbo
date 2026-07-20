import { Layer, ManagedRuntime } from 'effect'
import { SheetsModuleLive } from '../modules/sheets/index.ts'
import { AppConfigLive } from './config.ts'
import { DatabaseLive } from './Database.ts'
import { HealthcheckLive } from './Healthcheck.ts'
import { LoggingLive } from './Logging.ts'
import { ObservabilityLive } from './Observability.ts'
import { ErrorReporterLive } from './PostHog.ts'
import { BullConnectionLive } from './Queue.ts'
import { RedisLive } from './Redis.ts'

/** Shared infrastructure every module builds on. */
const CommonLive = Layer.mergeAll(
  DatabaseLive,
  RedisLive,
  BullConnectionLive,
  ErrorReporterLive,
  LoggingLive,
  ObservabilityLive,
).pipe(Layer.provideMerge(AppConfigLive))

/** Module layers drop in here; HealthcheckLive depends on Common resources. */
const AppLive = Layer.mergeAll(SheetsModuleLive, HealthcheckLive).pipe(
  Layer.provideMerge(CommonLive),
)

export const makeAppRuntime = () => ManagedRuntime.make(AppLive)

export type AppRuntime = ReturnType<typeof makeAppRuntime>
