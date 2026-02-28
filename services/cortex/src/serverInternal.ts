import {
  executeAndHandleGlobalErrors,
  globalLogger,
  resolveGlobalErrorLogObject,
} from '@lokalise/node-core'

import { ENABLE_ALL } from 'opinionated-machine'
import { getApp } from './app.ts'
import { getConfig } from './infrastructure/config.ts'

export async function startServer() {
  globalLogger.info('Starting application...')
  const config = executeAndHandleGlobalErrors(getConfig)
  const app = await getApp({
    monitoringEnabled: config.app.metrics.isEnabled,
    healthchecksEnabled: true,
    jobQueuesEnabled: ENABLE_ALL,
    enqueuedJobWorkersEnabled: ENABLE_ALL,
    // Cortex has no AMQP consumers (amqpSupportedMessages is empty), so disabling
    // this prevents the AmqpConnectionManager from attempting to connect to RabbitMQ.
    // Note: [] is truthy in JS so we must use false explicitly here.
    messageQueueConsumersEnabled: false,
    periodicJobsEnabled: ENABLE_ALL,
  })

  try {
    await app.listen({
      host: config.app.bindAddress,
      port: config.app.port,
      listenTextResolver: (address) => {
        return `node-service-template app listening at ${address}`
      },
    })
  } catch (err) {
    app.log.error(resolveGlobalErrorLogObject(err))
    process.exit(1)
  }
}
