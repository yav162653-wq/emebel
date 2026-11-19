import { z } from "zod";
import { api, apiErrorSchema } from "@shared/routes";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

async function getCsrfToken(): Promise<string> {
  const response = await fetch(api.csrf.token.path, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`CSRF token request failed: ${response.status}`);
  }
  return api.csrf.token.responses[200].parse(await response.json()).token;
}

export async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);
  if (!safeMethods.has(method)) {
    headers.set("X-CSRF-Token", await getCsrfToken());
  }

  return fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let message = text;
    try {
      const payload: unknown = JSON.parse(text);
      const parsed = apiErrorSchema.safeParse(payload);
      if (parsed.success) message = parsed.data.error;
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
    throw new Error(`${res.status}: ${message}`);
  }
}

export async function apiResponseJson<T>(
  res: Response,
  schema: z.ZodType<T>,
): Promise<T> {
  await throwIfResNotOk(res);
  const payload: unknown = await res.json();
  return schema.parse(payload);
}

export async function apiFetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  options?: RequestInit,
): Promise<T> {
  return apiResponseJson(await apiFetch(url, options), schema);
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await apiFetch(url, {
    method,
    headers: data !== undefined ? { "Content-Type": "application/json" } : {},
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

export async function apiRequestJson<T>(
  method: string,
  url: string,
  data: unknown,
  schema: z.ZodType<T>,
): Promise<T> {
  return apiResponseJson(await apiRequest(method, url, data), schema);
}
