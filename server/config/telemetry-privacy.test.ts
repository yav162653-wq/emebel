import assert from "node:assert/strict";
import { once } from "node:events";
import { createRequire } from "node:module";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import {
  AlwaysOnSampler,
  InMemorySpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import test from "node:test";
import {
  ignoreOAuthCallbackRequest,
  redactedServerQueryParams,
} from "./telemetry-privacy";

test("OAuth callback success and error requests do not export sensitive traces", async (t) => {
  const exporter = new InMemorySpanExporter();
  const instrumentation = new HttpInstrumentation({
    ignoreIncomingRequestHook: ignoreOAuthCallbackRequest,
    redactedQueryParamsServer: redactedServerQueryParams,
  });
  const provider = new NodeTracerProvider({
    sampler: new AlwaysOnSampler(),
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  provider.register();
  instrumentation.setTracerProvider(provider);
  instrumentation.enable();

  const { createServer } = createRequire(import.meta.url)("http") as typeof import("node:http");
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    if (ignoreOAuthCallbackRequest(request)) {
      const code = requestUrl.searchParams.get("code") ?? "";
      const state = requestUrl.searchParams.get("state") ?? "";
      const error = new Error(`OAuth provider failure: ${code} ${state}`);
      trace.getTracer("telemetry-privacy-test").startActiveSpan("callback-handler", (span) => {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.end();
      });
      response.statusCode = requestUrl.searchParams.has("error") ? 500 : 302;
    }
    response.end("done");
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    instrumentation.disable();
    await provider.shutdown();
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const code = "oauth-code-canary";
  const state = "oauth-state-canary";

  await fetch(`${baseUrl}/api/auth/external/google/callback?code=${code}&state=${state}`);
  await fetch(
    `${baseUrl}/api/auth/external/google/callback?error=access_denied&code=${code}&state=${state}`,
  );
  await fetch(`${baseUrl}/health`);
  await provider.forceFlush();

  const spans = exporter.getFinishedSpans();
  assert.equal(spans.length, 1, "only the ordinary health request should create a span");
  const serializedSpans = JSON.stringify(
    spans.map((span) => ({
      name: span.name,
      attributes: span.attributes,
      events: span.events,
      status: span.status,
    })),
  );
  assert.equal(serializedSpans.includes(code), false);
  assert.equal(serializedSpans.includes(state), false);
  assert.equal(serializedSpans.includes("OAuth provider failure"), false);
});
