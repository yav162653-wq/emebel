type ResendMockResponse = {
  status: number;
  body?: unknown;
  headers?: HeadersInit;
};

export type ResendMockRequest = {
  url: string;
  init: RequestInit;
  body: unknown;
};

export function createResendMock(responses: readonly ResendMockResponse[]) {
  const requests: ResendMockRequest[] = [];

  const fetcher: typeof fetch = async (input, init = {}) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
    if (typeof init.body !== "string") {
      throw new Error("Resend mock expects a serialized JSON request body");
    }

    const body: unknown = JSON.parse(init.body);
    requests.push({ url, init, body });
    const response = responses[requests.length - 1];
    if (!response) throw new Error("No response configured for Resend mock request");

    return new Response(
      response.body === undefined || response.status === 204
        ? null
        : JSON.stringify(response.body),
      { status: response.status, headers: response.headers },
    );
  };

  return { fetcher, requests };
}
