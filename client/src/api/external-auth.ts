import { api, type PublicIdentity } from "@shared/routes";
import { apiFetchJson } from "./http";

export type ExternalProvider = "google" | "github" | "telegram";

export async function fetchExternalProviders(): Promise<ExternalProvider[]> {
  const data = await apiFetchJson(
    api.auth.externalProviders.path,
    api.auth.externalProviders.responses[200],
  );
  return data.providers;
}

export async function fetchLinkedIdentities(): Promise<PublicIdentity[]> {
  return apiFetchJson(
    api.auth.identities.path,
    api.auth.identities.responses[200],
  );
}
