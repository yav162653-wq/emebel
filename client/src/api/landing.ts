import { api, type PublicStatsResponse } from "@shared/routes";
import { apiFetchJson } from "./http";

export type PublicStats = PublicStatsResponse;

export async function fetchPublicStats(): Promise<PublicStats> {
  return apiFetchJson(api.stats.get.path, api.stats.get.responses[200]);
}
