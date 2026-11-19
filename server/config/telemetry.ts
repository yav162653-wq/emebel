import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { env } from "./env";
import { logger } from "./logger";
import { ignoreOAuthCallbackRequest, redactedServerQueryParams } from "./telemetry-privacy";

const serviceName = env.OTEL_SERVICE_NAME;
const configuredEndpoint = env.OTEL_EXPORTER_OTLP_ENDPOINT;
const traceEndpoint = configuredEndpoint
  ? configuredEndpoint.endsWith("/v1/traces")
    ? configuredEndpoint
    : `${configuredEndpoint.replace(/\/$/, "")}/v1/traces`
  : undefined;

const configuredExporter = process.env.OTEL_TRACES_EXPORTER;
const telemetryEnabled =
  Boolean(traceEndpoint) &&
  configuredExporter !== "none";

// Do not let the SDK silently attempt localhost exports when no collector is configured.
if (!traceEndpoint && !configuredExporter) {
  process.env.OTEL_TRACES_EXPORTER = "none";
}

const sdk = new NodeSDK({
  serviceName,
  ...(traceEndpoint
    ? { traceExporter: new OTLPTraceExporter({ url: traceEndpoint }) }
    : {}),
  // Auto-instrumentation without an exporter can crash the bundled pg/OpenTelemetry
  // stack during requests. Keep instrumentation opt-in to an actual exporter.
  instrumentations: telemetryEnabled
    ? [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": { enabled: false },
        "@opentelemetry/instrumentation-http": {
          ignoreIncomingRequestHook: ignoreOAuthCallbackRequest,
          redactedQueryParamsServer: redactedServerQueryParams,
        },
        }),
      ]
    : [],
});

let started = false;

try {
  sdk.start();
  started = true;
  logger.info(
    {
      telemetry: telemetryEnabled ? "opentelemetry" : "disabled",
      serviceName,
      exporter: traceEndpoint ? "otlp" : "none",
    },
    telemetryEnabled
      ? "OpenTelemetry tracing enabled"
      : "OpenTelemetry disabled without an exporter"
  );
} catch (err) {
  logger.error({ err }, "OpenTelemetry failed to start");
}

export async function shutdownTelemetry(): Promise<void> {
  if (started) {
    await sdk.shutdown();
  }
}