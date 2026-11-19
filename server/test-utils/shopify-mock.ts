export type ShopifyGraphQLMockRequest = {
  operationName: string;
  query: string;
  variables?: unknown;
};

export function createShopifyGraphQLMock(responses: Record<string, unknown>) {
  const requests: ShopifyGraphQLMockRequest[] = [];

  const fetcher: typeof fetch = async (_input, init = {}) => {
    if (typeof init.body !== "string") {
      throw new Error("Shopify mock expects a serialized GraphQL request body");
    }

    const payload: unknown = JSON.parse(init.body);
    if (
      typeof payload !== "object"
      || payload === null
      || !("query" in payload)
      || typeof payload.query !== "string"
    ) {
      throw new Error("Shopify mock received an invalid GraphQL request");
    }

    const operationName = payload.query.match(/\b(?:query|mutation)\s+([A-Za-z_]\w*)/)?.[1];
    if (!operationName) throw new Error("Shopify GraphQL operation must have a name");
    requests.push({
      operationName,
      query: payload.query,
      variables: "variables" in payload ? payload.variables : undefined,
    });

    const response = responses[operationName];
    if (response === undefined) {
      throw new Error(`No response configured for Shopify operation ${operationName}`);
    }
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  return { fetcher, requests };
}
