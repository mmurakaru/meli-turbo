import { NodeSdk } from '@effect/opentelemetry'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { Effect, Layer } from 'effect'
import { AppConfig } from './config.ts'

/**
 * One OpenTelemetry pipeline. The Prometheus exporter runs its own HTTP server on
 * the configured port and serves Effect metrics at /metrics; OTLP trace export is
 * added only when tracing is enabled by config.
 */
export const ObservabilityLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const config = yield* AppConfig
    const { serviceName, tracingEnabled, exporterUrl, prometheusPort } = config.observability
    return NodeSdk.layer(() => ({
      resource: { serviceName, serviceVersion: config.app.appVersion },
      metricReader: new PrometheusExporter({ port: prometheusPort, host: '0.0.0.0' }),
      ...(tracingEnabled
        ? { spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({ url: exporterUrl })) }
        : {}),
    }))
  }),
)
