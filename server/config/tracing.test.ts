import assert from "node:assert/strict";
import { SpanStatusCode } from "@opentelemetry/api";
import {
  AlwaysOnSampler,
  InMemorySpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import test from "node:test";
import { createShopifyStorefrontClient } from "./shopifyStorefrontClient";
import { withActiveSpan } from "./tracing";
import { ResendEmailSender } from "../modules/identity/infrastructure/resend-email.sender";

test("manual spans record safe error metadata without exception messages", async () => {
  const exporter = new InMemorySpanExporter();
  const provider = new NodeTracerProvider({
    sampler: new AlwaysOnSampler(),
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  provider.register();
  try {
    await withActiveSpan("auth.login", { "auth.operation": "login" }, async () => "ok");
    await assert.rejects(
      withActiveSpan("resend.email.send", { "email.provider": "resend" }, async () => {
        throw new Error("email-address-secret-canary");
      }),
    );
    const shopifyClient = createShopifyStorefrontClient(
      async () => ({
        shopDomain: "example.myshopify.com",
        storefrontAccessToken: "test-token",
      }),
      async () => new Response(JSON.stringify({ data: { products: { nodes: [] } } })),
    );
    await shopifyClient.request("query Products { products { nodes { id } } }");

    const emailSender = new ResendEmailSender("auth@example.com", undefined, {
      apiKey: "test-api-key",
      fetcher: async () => new Response(JSON.stringify({ id: "email-test-id" })),
    });
    await emailSender.send({
      to: "trace-secret@example.invalid",
      subject: "Sign in",
      text: "One-time sign-in link",
      kind: "magic_login",
      idempotencyKey: "stable-email-key",
    });
    await provider.forceFlush();

    const spans = exporter.getFinishedSpans();
    const authSpan = spans.find((span) => span.name === "auth.login");
    const failedSpan = spans.find((span) => span.name === "resend.email.send"
      && span.status.code === SpanStatusCode.ERROR);
    const shopifySpan = spans.find((span) => span.name === "shopify.storefront.request");
    const resendSpan = spans.find((span) => span.name === "resend.email.send"
      && span.status.code !== SpanStatusCode.ERROR);
    assert.equal(authSpan?.attributes["auth.operation"], "login");
    assert.equal(failedSpan?.attributes["error.type"], "Error");
    assert.equal(shopifySpan?.attributes["shopify.operation"], "Products");
    assert.equal(resendSpan?.attributes["email.kind"], "magic_login");
    const recordedData = JSON.stringify(spans.map((span) => ({
      attributes: span.attributes,
      events: span.events.map((event) => ({ name: event.name, attributes: event.attributes })),
    })));
    assert.equal(recordedData.includes("email-address-secret-canary"), false);
    assert.equal(recordedData.includes("trace-secret@example.invalid"), false);
  } finally {
    await provider.shutdown();
  }
});
