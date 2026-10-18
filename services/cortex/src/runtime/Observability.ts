import { NodeSdk } from '@effect/opentelemetry'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { Effect, Layer, Metric } from 'effect'
import { AppConfig } from './config.ts'

/**
 * One OpenTelemetry pipeline. The Prometheus exporter runs its own HTTP server on
 * the configured port and serves Effect metrics at /metrics; OTLP trace export is
 * added only when tracing is enabled by config. Fiber runtime metrics are opt-in in
 * Effect 4 (they were always on in Effect 3), so they are enabled here.
 */
export const ObservabilityLive = Layer.unwrap(
  Effect.gen(function* () {
    const config = yield* AppConfig
    const { serviceName, tracingEnabled, exporterUrl, prometheusPort } = config.observability
    const sdk = NodeSdk.layer(() => ({
      resource: { serviceName, serviceVersion: config.app.appVersion },
      metricReader: new PrometheusExporter({ port: prometheusPort, host: '0.0.0.0' }),
      ...(tracingEnabled
        ? { spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({ url: exporterUrl })) }
        : {}),
    }))
    return Layer.merge(sdk, Metric.enableRuntimeMetricsLayer)
  }),
)
