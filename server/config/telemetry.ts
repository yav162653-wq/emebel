import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { env } from "./env";
import { logger } from "./logger";

const serviceName = env.OTEL_SERVICE_NAME;
const configuredEndpoint = env.OTEL_EXPORTER_OTLP_ENDPOINT;
const traceEndpoint = configuredEndpoint
  ? configuredEndpoint.endsWith("/v1/traces")
    ? configuredEndpoint
    : `${configuredEndpoint.replace(/\/$/, "")}/v1/traces`
  : undefined;

// Do not let the SDK silently attempt localhost exports when no collector is configured.
if (!traceEndpoint && !process.env.OTEL_TRACES_EXPORTER) {
  process.env.OTEL_TRACES_EXPORTER = "none";
}

const sdk = new NodeSDK({
  serviceName,
  ...(traceEndpoint
    ? { traceExporter: new OTLPTraceExporter({ url: traceEndpoint }) }
    : {}),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
  ],
});

let started = false;

try {
  sdk.start();
  started = true;
  logger.info(
    {
      telemetry: "opentelemetry",
      serviceName,
      exporter: traceEndpoint ? "otlp" : "none",
    },
    traceEndpoint
      ? "OpenTelemetry tracing enabled"
      : "OpenTelemetry instrumentation enabled without an exporter"
  );
} catch (err) {
  logger.error({ err }, "OpenTelemetry failed to start");
}

export async function shutdownTelemetry(): Promise<void> {
  if (started) {
    await sdk.shutdown();
  }
}