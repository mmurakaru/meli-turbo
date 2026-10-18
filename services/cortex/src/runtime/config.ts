import {
  Config,
  Context,
  Effect,
  Layer,
  type LogLevel,
  Redacted,
  Schema,
  SchemaIssue,
} from 'effect'

export const SERVICE_NAME = 'cortex'

export type EnvironmentVariableSpec = {
  readonly name: string
  readonly group: string
  readonly description: string
  readonly secret?: boolean
  readonly defaultValue?: string
  readonly optional?: boolean
}

const registry: Array<EnvironmentVariableSpec> = []

// Effect 4's built-in Config.Boolean / Config.LogLevel accept a different set of inputs
// than Effect 3 did (e.g. LogLevel is now case-sensitive, so LOG_LEVEL=info would be
// rejected). These keep the Effect 3 parsing rules so existing env files keep working.
const TRUE_VALUES = ['true', 'yes', 'on', '1'] as const
const FALSE_VALUES = ['false', 'no', 'off', '0'] as const

function booleanConfig(name: string): Config.Config<boolean> {
  return Config.Literals([...TRUE_VALUES, ...FALSE_VALUES], name).pipe(
    Config.map((value) => (TRUE_VALUES as ReadonlyArray<string>).includes(value)),
  )
}

const LOG_LEVEL_LABELS: Record<string, LogLevel.LogLevel> = {
  ALL: 'All',
  FATAL: 'Fatal',
  ERROR: 'Error',
  WARN: 'Warn',
  INFO: 'Info',
  DEBUG: 'Debug',
  TRACE: 'Trace',
  OFF: 'None',
}

/** Case-insensitive log level (ALL, FATAL, ERROR, WARN, INFO, DEBUG, TRACE, OFF). */
function logLevelConfig(name: string): Config.Config<LogLevel.LogLevel> {
  return Config.String(name).pipe(
    Config.mapEffect((value) => {
      const level = LOG_LEVEL_LABELS[value.toUpperCase()]
      return level === undefined
        ? Effect.fail(
            new Config.ConfigError(
              new Schema.SchemaError(
                new SchemaIssue.InvalidValue({
                  message: `Expected a log level but received ${JSON.stringify(value)}`,
                }),
              ),
            ),
          )
        : Effect.succeed(level)
    }),
  )
}

/**
 * Registers a variable's documentation metadata while constructing its Config, so
 * `scripts/generate-env-docs.ts` can render docs from the same definition it validates.
 */
function documented<A>(
  spec: EnvironmentVariableSpec,
  build: (name: string) => Config.Config<A>,
): Config.Config<A> {
  registry.push(spec)
  return build(spec.name)
}

const appConfig = Config.all({
  nodeEnv: documented(
    {
      name: 'NODE_ENV',
      group: 'app',
      description: 'Runtime environment; selects pretty vs JSON logging.',
      defaultValue: 'development',
    },
    (name) =>
      Config.Literals(['development', 'production', 'test'], name).pipe(
        Config.withDefault('development' as const),
      ),
  ),
  appEnv: documented(
    {
      name: 'APP_ENV',
      group: 'app',
      description: 'Deployment environment reported to observability vendors.',
      defaultValue: 'development',
    },
    (name) =>
      Config.Literals(['development', 'staging', 'production'], name).pipe(
        Config.withDefault('development' as const),
      ),
  ),
  appVersion: documented(
    {
      name: 'APP_VERSION',
      group: 'app',
      description: 'Application version reported by the health endpoint and traces.',
      defaultValue: 'VERSION_NOT_SET',
    },
    (name) => Config.String(name).pipe(Config.withDefault('VERSION_NOT_SET')),
  ),
  gitCommitSha: documented(
    {
      name: 'GIT_COMMIT_SHA',
      group: 'app',
      description: 'Git commit SHA of the deployed build, reported by the health endpoint.',
      defaultValue: 'COMMIT_SHA_NOT_SET',
    },
    (name) => Config.String(name).pipe(Config.withDefault('COMMIT_SHA_NOT_SET')),
  ),
  port: documented(
    {
      name: 'APP_PORT',
      group: 'app',
      description: 'HTTP server listening port.',
      defaultValue: '3000',
    },
    (name) => Config.Int(name).pipe(Config.withDefault(3000)),
  ),
  bindAddress: documented(
    {
      name: 'APP_BIND_ADDRESS',
      group: 'app',
      description: 'HTTP server bind address (0.0.0.0 exposes on all interfaces).',
      defaultValue: '0.0.0.0',
    },
    (name) => Config.String(name).pipe(Config.withDefault('0.0.0.0')),
  ),
  baseUrl: documented(
    {
      name: 'BASE_URL',
      group: 'app',
      description: 'Public URL where the service is reachable, used in the OpenAPI spec.',
      defaultValue: '',
    },
    (name) => Config.String(name).pipe(Config.withDefault('')),
  ),
  logLevel: documented(
    {
      name: 'LOG_LEVEL',
      group: 'app',
      description: 'Minimum log level emitted by the Effect logger.',
      defaultValue: 'Info',
    },
    (name) => logLevelConfig(name).pipe(Config.withDefault<LogLevel.LogLevel>('Info')),
  ),
  jwtPublicKey: documented(
    {
      name: 'JWT_PUBLIC_KEY',
      group: 'app',
      description:
        'RS256 public key (PEM) used to verify request JWTs; use || as a newline separator on a single line.',
    },
    (name) => Config.String(name).pipe(Config.map((value) => value.replaceAll('||', '\n'))),
  ),
})

const databaseConfig = Config.all({
  url: documented(
    {
      name: 'DATABASE_URL',
      group: 'database',
      description: 'PostgreSQL connection URL including credentials and database name.',
      secret: true,
    },
    (name) => Config.Redacted(name),
  ),
  maxConnections: documented(
    {
      name: 'DATABASE_MAX_CONNECTIONS',
      group: 'database',
      description: 'Maximum size of the PostgreSQL connection pool.',
      defaultValue: '10',
    },
    (name) => Config.Int(name).pipe(Config.withDefault(10)),
  ),
})

const redisConfig = Config.all({
  host: documented(
    {
      name: 'REDIS_HOST',
      group: 'redis',
      description: 'Redis hostname used for the result cache and the BullMQ connection.',
      defaultValue: 'localhost',
    },
    (name) => Config.String(name).pipe(Config.withDefault('localhost')),
  ),
  port: documented(
    {
      name: 'REDIS_PORT',
      group: 'redis',
      description: 'Redis port.',
      defaultValue: '6379',
    },
    (name) => Config.Int(name).pipe(Config.withDefault(6379)),
  ),
  username: documented(
    {
      name: 'REDIS_USERNAME',
      group: 'redis',
      description: 'Redis authentication username; omit for an unauthenticated Redis.',
      optional: true,
    },
    (name) => Config.String(name).pipe(Config.option),
  ),
  password: documented(
    {
      name: 'REDIS_PASSWORD',
      group: 'redis',
      description: 'Redis authentication password; omit for an unauthenticated Redis.',
      secret: true,
      optional: true,
    },
    (name) => Config.Redacted(name).pipe(Config.option),
  ),
  keyPrefix: documented(
    {
      name: 'REDIS_KEY_PREFIX',
      group: 'redis',
      description: 'Prefix applied to every Redis key.',
      defaultValue: 'cortex',
    },
    (name) => Config.String(name).pipe(Config.withDefault('cortex')),
  ),
  useTls: documented(
    {
      name: 'REDIS_USE_TLS',
      group: 'redis',
      description: 'Whether to use TLS for the Redis connection.',
      defaultValue: 'true',
    },
    (name) => booleanConfig(name).pipe(Config.withDefault(true)),
  ),
})

const queueConfig = Config.all({
  concurrency: documented(
    {
      name: 'QUEUE_CONCURRENCY',
      group: 'queue',
      description: 'Number of jobs a BullMQ worker processes concurrently.',
      defaultValue: '5',
    },
    (name) => Config.Int(name).pipe(Config.withDefault(5)),
  ),
})

const aiConfig = Config.all({
  baseUrl: documented(
    {
      name: 'AI_BASE_URL',
      group: 'ai',
      description: 'Base URL for the OpenAI-compatible AI provider.',
      defaultValue: 'http://localhost:11434/v1',
    },
    (name) => Config.String(name).pipe(Config.withDefault('http://localhost:11434/v1')),
  ),
  model: documented(
    {
      name: 'AI_MODEL',
      group: 'ai',
      description: 'Model identifier used for sheet generation.',
      defaultValue: 'qwen2.5:7b',
    },
    (name) => Config.String(name).pipe(Config.withDefault('qwen2.5:7b')),
  ),
  apiKey: documented(
    {
      name: 'AI_API_KEY',
      group: 'ai',
      description: 'API key for the AI provider (use "ollama" for a local Ollama).',
      secret: true,
      defaultValue: 'ollama',
    },
    (name) => Config.Redacted(name).pipe(Config.withDefault(Redacted.make('ollama'))),
  ),
})

const posthogConfig = Config.all({
  apiKey: documented(
    {
      name: 'POSTHOG_API_KEY',
      group: 'posthog',
      description: 'PostHog project API key; when unset, error and event capture are no-ops.',
      secret: true,
      optional: true,
    },
    (name) => Config.Redacted(name).pipe(Config.option),
  ),
  host: documented(
    {
      name: 'POSTHOG_HOST',
      group: 'posthog',
      description: 'PostHog ingestion host.',
      defaultValue: 'https://eu.i.posthog.com',
    },
    (name) => Config.String(name).pipe(Config.withDefault('https://eu.i.posthog.com')),
  ),
})

const observabilityConfig = Config.all({
  serviceName: documented(
    {
      name: 'OTEL_SERVICE_NAME',
      group: 'observability',
      description: 'Resource service.name attached to traces and metrics.',
      defaultValue: SERVICE_NAME,
    },
    (name) => Config.String(name).pipe(Config.withDefault(SERVICE_NAME)),
  ),
  tracingEnabled: documented(
    {
      name: 'OTEL_TRACING_ENABLED',
      group: 'observability',
      description: 'Whether to export OpenTelemetry traces via OTLP.',
      defaultValue: 'false',
    },
    (name) => booleanConfig(name).pipe(Config.withDefault(false)),
  ),
  exporterUrl: documented(
    {
      name: 'OTEL_EXPORTER_OTLP_TRACES_ENDPOINT',
      group: 'observability',
      description: 'OTLP HTTP traces endpoint used when tracing is enabled.',
      defaultValue: 'http://localhost:4318/v1/traces',
    },
    (name) => Config.String(name).pipe(Config.withDefault('http://localhost:4318/v1/traces')),
  ),
  prometheusPort: documented(
    {
      name: 'METRICS_PROMETHEUS_PORT',
      group: 'observability',
      description: 'Port on which the Prometheus exporter serves /metrics.',
      defaultValue: '9080',
    },
    (name) => Config.Int(name).pipe(Config.withDefault(9080)),
  ),
})

const rootConfig = Config.all({
  app: appConfig,
  database: databaseConfig,
  redis: redisConfig,
  queue: queueConfig,
  ai: aiConfig,
  posthog: posthogConfig,
  observability: observabilityConfig,
})

export type AppConfigValues = typeof rootConfig extends Config.Config<infer A> ? A : never

export class AppConfig extends Context.Service<AppConfig, AppConfigValues>()('AppConfig') {}

export const AppConfigLive = Layer.effect(
  AppConfig,
  Effect.gen(function* () {
    return yield* rootConfig
  }),
)

/** Documentation metadata for every environment variable, in declaration order. */
export const environmentVariableRegistry: ReadonlyArray<EnvironmentVariableSpec> = registry
