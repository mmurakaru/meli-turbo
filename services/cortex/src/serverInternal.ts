import { fastifyCors } from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyJWT from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import scalarFastifyApiReference from '@scalar/fastify-api-reference'
import { Effect } from 'effect'
import fastify, { type FastifyInstance } from 'fastify'
import {
  createJsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { registerSheetRoutes } from './modules/sheets/index.ts'
import { type AppRuntime, makeAppRuntime } from './runtime/AppRuntime.ts'
import { AppConfig, SERVICE_NAME } from './runtime/config.ts'
import { registerErrorHandler } from './runtime/ErrorHandler.ts'
import { Healthcheck } from './runtime/Healthcheck.ts'

const JWT_SKIP_LIST = new Set(['/', '/health', '/documentation', '/documentation/openapi.json'])

export type BuiltServer = { readonly app: FastifyInstance; readonly runtime: AppRuntime }

/** Builds the Fastify shell around the Effect runtime, without listening. */
export async function buildServer(runtime: AppRuntime = makeAppRuntime()): Promise<BuiltServer> {
  const config = await runtime.runPromise(Effect.service(AppConfig))
  const isDevelopment = config.app.nodeEnv === 'development'

  const app = fastify({ logger: false })
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(fastifyHelmet, isDevelopment ? { contentSecurityPolicy: false } : {})
  if (isDevelopment) {
    await app.register(fastifyCors, {
      origin: '*',
      credentials: true,
      methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Accept', 'Content-Type', 'Authorization'],
    })
  }

  await app.register(fastifySwagger, {
    transform: createJsonSchemaTransform({ skipList: ['/documentation', '/documentation/*'] }),
    openapi: {
      info: {
        title: SERVICE_NAME,
        description: 'Cortex sheet-generation service',
        version: config.app.appVersion,
      },
      servers: [
        {
          url:
            config.app.baseUrl ||
            `http://${config.app.bindAddress === '0.0.0.0' ? 'localhost' : config.app.bindAddress}:${config.app.port}`,
        },
      ],
      components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      },
    },
  })
  await app.register(scalarFastifyApiReference, { routePrefix: '/documentation' })

  await app.register(fastifyJWT, { secret: { public: config.app.jwtPublicKey } })
  app.addHook('onRequest', async (request, reply) => {
    const path = request.url.split('?')[0] ?? request.url
    if (JWT_SKIP_LIST.has(path) || path.startsWith('/documentation/')) {
      return
    }
    try {
      await request.jwtVerify()
    } catch {
      return reply.status(401).send({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    }
  })

  registerErrorHandler(app, runtime)

  app.get('/health', async (_request, reply) => {
    const report = await runtime.runPromise(Healthcheck.use((healthcheck) => healthcheck.report))
    return reply.status(report.healthy ? 200 : 503).send({
      ...report,
      version: config.app.appVersion,
      gitCommitSha: config.app.gitCommitSha,
    })
  })

  registerSheetRoutes(app, runtime)

  await app.ready()
  return { app, runtime }
}

export async function startServer(): Promise<void> {
  const runtime = makeAppRuntime()
  const config = await runtime.runPromise(Effect.service(AppConfig))
  const { app } = await buildServer(runtime)

  let shuttingDown = false
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) {
      return
    }
    shuttingDown = true
    await runtime.runPromise(Effect.logInfo(`Received ${signal}, shutting down`))
    await app.close()
    await runtime.dispose()
    process.exit(0)
  }
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))

  await app.listen({ port: config.app.port, host: config.app.bindAddress })
  await runtime.runPromise(
    Effect.logInfo('Cortex started').pipe(
      Effect.annotateLogs('port', config.app.port),
      Effect.annotateLogs('environment', config.app.nodeEnv),
    ),
  )
}
