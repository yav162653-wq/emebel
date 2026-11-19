import type { IncomingMessage } from "node:http";

// Keep the HTTP instrumentation defaults when replacing its redaction list.
export const redactedServerQueryParams = [
  "sig",
  "Signature",
  "AWSAccessKeyId",
  "X-Goog-Signature",
  "X-Amz-Signature",
  "X-Amz-Credential",
  "X-Amz-Security-Token",
  "code",
  "state",
];

export function ignoreOAuthCallbackRequest(request: Pick<IncomingMessage, "url">): boolean {
  if (!request.url) return false;

  try {
    const pathname = new URL(request.url, "http://localhost").pathname;
    return /^\/api\/auth\/external\/[^/]+\/callback\/?$/.test(pathname);
  } catch {
    return true;
  }
}
