import { Effect, Layer, Logger } from 'effect'
import { AppConfig } from './config.ts'

/**
 * JSON logs to stdout in production (trace/span correlated), pretty logs in
 * development and test. Minimum level comes from LOG_LEVEL.
 */
export const LoggingLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const config = yield* AppConfig
    const format = config.app.nodeEnv === 'production' ? Logger.json : Logger.pretty
    return Layer.merge(format, Logger.minimumLogLevel(config.app.logLevel))
  }),
)
