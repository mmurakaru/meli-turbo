import { Cause, Context, Effect, Layer, Option, Redacted } from 'effect'
import { PostHog } from 'posthog-node'
import { AppConfig } from './config.ts'

export type ErrorReporterService = {
  readonly captureException: (error: unknown, distinctId?: string) => Effect.Effect<void>
  readonly captureEvent: (
    event: string,
    properties?: Record<string, unknown>,
    distinctId?: string,
  ) => Effect.Effect<void>
}

export class ErrorReporter extends Context.Service<ErrorReporter, ErrorReporterService>()(
  'ErrorReporter',
) {}

/**
 * PostHog-backed error and event capture. Without POSTHOG_API_KEY every capture is a
 * no-op, so local development needs no vendor account.
 */
export const ErrorReporterLive = Layer.effect(
  ErrorReporter,
  Effect.gen(function* () {
    const config = yield* AppConfig
    if (Option.isNone(config.posthog.apiKey)) {
      return noopReporter
    }
    const client = yield* Effect.acquireRelease(
      Effect.sync(
        () =>
          new PostHog(Redacted.value(Option.getOrThrow(config.posthog.apiKey)), {
            host: config.posthog.host,
          }),
      ),
      (posthog) => Effect.promise(() => posthog.shutdown().catch(() => undefined)),
    )
    return {
      captureException: (error, distinctId = 'server') =>
        Effect.sync(() => {
          client.captureException(toError(error), distinctId)
        }),
      captureEvent: (event, properties, distinctId = 'server') =>
        Effect.sync(() => {
          client.capture({ distinctId, event, properties })
        }),
    }
  }),
)

const noopReporter: ErrorReporterService = {
  captureException: () => Effect.void,
  captureEvent: () => Effect.void,
}

/** Reports the failure cause to PostHog without altering the effect's outcome. */
export const reportFailures = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, R | ErrorReporter> =>
  effect.pipe(
    Effect.tapCause((cause) =>
      ErrorReporter.use((reporter) => reporter.captureException(Cause.squash(cause))),
    ),
  )

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}
