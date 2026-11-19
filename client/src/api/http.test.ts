import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./http";

function response(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

describe("apiFetch CSRF protection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches a token and attaches it to unsafe requests", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response({ token: "session-csrf-token" }))
      .mockResolvedValueOnce(response(null, 204));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/cart", { method: "POST", body: "{}" });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/csrf-token", {
      credentials: "include",
    });
    const mutationCall = fetchMock.mock.calls[1];
    expect(mutationCall).toBeDefined();
    expect(new Headers(mutationCall?.[1]?.headers).get("X-CSRF-Token"))
      .toBe("session-csrf-token");
  });

  it("does not send a mutation when token retrieval fails", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response(null, 503));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/cart", { method: "DELETE" }))
      .rejects.toThrow("CSRF token request failed: 503");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not request a token for safe methods", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response({}));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/products");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
