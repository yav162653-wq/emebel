import { apiFetch } from "./http";

export type ExternalProvider = "google" | "github" | "telegram";

export async function fetchExternalProviders(): Promise<ExternalProvider[]> {
  const res = await apiFetch("/api/auth/external/providers");
  if (!res.ok) throw new Error("Provider configuration unavailable");
  const data = await res.json() as { providers: ExternalProvider[] };
  return data.providers;
}

export async function fetchLinkedIdentities(): Promise<Array<{ provider: string }>> {
  const res = await apiFetch("/api/auth/identities");
  if (!res.ok) throw new Error("Linked identities unavailable");
  return res.json();
}
