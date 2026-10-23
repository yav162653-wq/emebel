export interface ApiClientOptions {
  baseUrl?: string;
  credentials?: RequestCredentials;
}

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? "";
  const credentials = options.credentials ?? "include";

  return {
    async request<T>(
      path: string,
      init: RequestInit & { parse?: (value: unknown) => T } = {},
    ): Promise<T> {
      const { parse, ...requestInit } = init;
      const response = await fetch(`${baseUrl}${path}`, {
        ...requestInit,
        credentials,
        headers: {
          "Content-Type": "application/json",
          ...requestInit.headers,
        },
      });

      const body = await response.json().catch(() => undefined);
      if (!response.ok) {
        const message =
          body && typeof body === "object" && "error" in body
            ? String(body.error)
            : `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      return parse ? parse(body) : (body as T);
    },
  };
}