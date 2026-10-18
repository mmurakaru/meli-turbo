import type { ConnectionOptions } from 'bullmq'
import { Context, Effect, Layer } from 'effect'
import { AppConfig } from './config.ts'
import { redisOptionsFromConfig } from './Redis.ts'

export type BullConnectionSettings = {
  readonly connection: ConnectionOptions
  readonly prefix: string
  readonly concurrency: number
}

/**
 * Connection settings shared by every BullMQ Queue and Worker. Uses the unprefixed
 * base Redis options plus BullMQ's own key prefix.
 */
export class BullConnection extends Context.Service<BullConnection, BullConnectionSettings>()(
  'BullConnection',
) {}

export const BullConnectionLive = Layer.effect(
  BullConnection,
  Effect.gen(function* () {
    const config = yield* AppConfig
    return {
      connection: redisOptionsFromConfig(config.redis),
      prefix: `${config.redis.keyPrefix}:bull`,
      concurrency: config.queue.concurrency,
    }
  }),
)
