import { z } from "zod";
import { apiErrorSchema } from "@shared/routes";

export async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(url, {
    credentials: "include",
    ...options,
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
