import { context, SpanStatusCode, trace, type Attributes } from "@opentelemetry/api";
import type { Request, RequestHandler } from "express";

type RequestSpanDefinition = {
  name: string;
  attributes?: Attributes;
};

export async function withActiveSpan<T>(
  name: string,
  attributes: Attributes,
  operation: () => Promise<T>,
): Promise<T> {
  return trace.getTracer("emebel").startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.setAttribute("error.type", error instanceof Error ? error.name : "unknown");
      throw error;
    } finally {
      span.end();
    }
  });
}

export function createResponseSpanMiddleware(
  resolveSpan: (request: Request) => RequestSpanDefinition,
): RequestHandler {
  return (req, res, next) => {
    const definition = resolveSpan(req);
    const span = trace.getTracer("emebel").startSpan(
      definition.name,
      { attributes: definition.attributes },
    );
    let ended = false;
    const endSpan = () => {
      if (ended) return;
      ended = true;
      span.setAttribute("http.response.status_code", res.statusCode);
      if (res.statusCode >= 500) {
        span.setStatus({ code: SpanStatusCode.ERROR });
      }
      span.end();
    };

    res.once("finish", endSpan);
    res.once("close", endSpan);
    context.with(trace.setSpan(context.active(), span), next);
  };
}
