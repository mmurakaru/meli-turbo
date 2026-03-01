import type {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from 'fastify'
import fp from 'fastify-plugin'

export type JwtTokenPluginOptions = {
  skipList: Set<string>
}

function plugin(
  fastify: FastifyInstance,
  pluginOptions: JwtTokenPluginOptions,
  next: (err?: Error) => void,
) {
  fastify.addHook(
    'onRequest',
    (req: FastifyRequest, _res: FastifyReply, done: HookHandlerDoneFunction) => {
      const url = req.routeOptions.url ?? ''
      // DEV: prefix-match so Scalar's asset sub-paths (/documentation/js/scalar.js etc.) are also skipped.
      // Before deploying, revert to the exact-match only: `if (pluginOptions.skipList.has(url))`
      if (pluginOptions.skipList.has(url) || url.startsWith('/documentation')) {
        return done()
      }

      req
        .jwtVerify()
        .then(() => {
          done()
        })
        .catch((err) => {
          done(err)
        })
    },
  )

  next()
}

export const jwtTokenPlugin: FastifyPluginCallback<JwtTokenPluginOptions> =
  fp<JwtTokenPluginOptions>(plugin, {
    fastify: '5.x',
    name: 'jwt-token-plugin',
  })
