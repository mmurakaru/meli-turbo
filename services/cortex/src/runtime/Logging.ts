import { Effect, Formatter, Layer, Logger, References } from 'effect'
import { AppConfig } from './config.ts'

/**
 * Production JSON logger. Effect 4's built-in `Logger.consoleJson` renames the
 * v3 `logLevel` field to `level`; this keeps the v3 field name and key order so
 * existing log queries/dashboards keep working.
 */
const consoleJson = Logger.formatStructured.pipe(
  Logger.map((entry) =>
    Formatter.formatJson({
      message: entry.message,
      logLevel: entry.level,
      timestamp: entry.timestamp,
      cause: entry.cause,
      annotations: entry.annotations,
      spans: entry.spans,
      fiberId: entry.fiberId,
    }),
  ),
  Logger.withConsoleLog,
)

/**
 * JSON logs to stdout in production (trace/span correlated), pretty logs in
 * development and test. Minimum level comes from LOG_LEVEL.
 */
export const LoggingLive = Layer.unwrap(
  Effect.gen(function* () {
    const config = yield* AppConfig
    const format = config.app.nodeEnv === 'production' ? consoleJson : Logger.consolePretty()
    return Layer.merge(
      Logger.layer([format]),
      Layer.succeed(References.MinimumLogLevel, config.app.logLevel),
    )
  }),
)
