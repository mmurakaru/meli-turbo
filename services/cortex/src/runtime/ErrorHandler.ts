import { Cause, Effect, Exit, type ManagedRuntime } from 'effect'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { AppRuntime } from './AppRuntime.ts'
import { ErrorReporter } from './PostHog.ts'

export type ErrorBody = { readonly message: string; readonly code: string }

/** The context the AppRuntime provides to handler effects. */
type AppEnv = AppRuntime extends ManagedRuntime.ManagedRuntime<infer R, infer _E> ? R : never

/**
 * The single typed-error -> (status, body) mapping. Domain tagged errors map to 4xx/5xx
 * here; Fastify/Zod validation errors carry their own sub-500 statusCode; everything
 * else is an unexpected 500. This is the one place the HTTP error contract lives.
 */
function toResponse(error: unknown): { status: number; body: ErrorBody } {
  const tag = tagOf(error)
  switch (tag) {
    case 'QueueUnavailable':
      return { status: 503, body: { message: 'Service temporarily unavailable', code: tag } }
    default:
      break
  }
  const statusCode = (error as { statusCode?: number }).statusCode
  if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
    return { status: statusCode, body: { message: messageOf(error), code: 'BAD_REQUEST' } }
  }
  return { status: 500, body: { message: 'Internal Server Error', code: 'INTERNAL' } }
}

/**
 * Runs a handler effect on the shared runtime, annotating the request id for log/span
 * correlation, and surfaces the raw typed failure (not a wrapping FiberFailure) so the
 * central error handler can map it.
 */
export function runHandler<A, E>(
  runtime: AppRuntime,
  request: FastifyRequest,
  effect: Effect.Effect<A, E, AppEnv>,
): Promise<A> {
  return runtime
    .runPromiseExit(
      effect.pipe(
        Effect.annotateLogs('requestId', request.id),
        Effect.annotateSpans('requestId', request.id),
      ),
    )
    .then((exit) => {
      if (Exit.isSuccess(exit)) {
        return exit.value
      }
      throw Cause.squash(exit.cause)
    })
}

/**
 * Central error and not-found seam. Every error - typed domain failures, Zod
 * validation, and unexpected defects - is mapped to a stable shape here and, for 5xx,
 * captured to PostHog. Replaces createErrorHandler from fastify-extras.
 */
export function registerErrorHandler(app: FastifyInstance, runtime: AppRuntime): void {
  app.setErrorHandler((error: unknown, request: FastifyRequest, reply: FastifyReply) => {
    const { status, body } = toResponse(error)
    void runtime.runPromise(
      Effect.gen(function* () {
        if (status >= 500) {
          yield* Effect.logError('Unhandled request error', error).pipe(
            Effect.annotateLogs('requestId', request.id),
          )
          const reporter = yield* ErrorReporter
          yield* reporter.captureException(error)
        }
      }).pipe(Effect.catchAllCause(() => Effect.void)),
    )
    return reply.status(status).send(body)
  })

  app.setNotFoundHandler((_request: FastifyRequest, reply: FastifyReply) =>
    reply.status(404).send({ message: 'Route not found', code: 'NOT_FOUND' } satisfies ErrorBody),
  )
}

function tagOf(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && '_tag' in error
    ? String((error as { _tag: unknown })._tag)
    : undefined
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Bad Request'
}
