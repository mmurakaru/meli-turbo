import { type FauxqsServer, startFauxqs } from 'fauxqs'

let server: FauxqsServer

export async function startTestFauxqs(): Promise<FauxqsServer> {
  server = await startFauxqs({ port: 4567, logger: false, messageSpies: true })
  server.setup({
    queues: [],
    topics: [],
    subscriptions: [],
  })

  return server
}

export async function stopTestFauxqs(): Promise<void> {
  await server?.stop()
}
