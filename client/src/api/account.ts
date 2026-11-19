import { api, type User, type UserProfileUpdate } from "@shared/routes";
import { apiRequestJson } from "./http";

export async function updateProfile(name: string): Promise<User> {
  const input: UserProfileUpdate = api.auth.profile.input.parse({ name });
  return apiRequestJson(
    api.auth.profile.method,
    api.auth.profile.path,
    input,
    api.auth.profile.responses[200],
  );
}

export async function requestAccountLink(email: string): Promise<{ message: string }> {
  const input = api.auth.accountLinkRequest.input.parse({ email });
  return apiRequestJson(
    api.auth.accountLinkRequest.method,
    api.auth.accountLinkRequest.path,
    input,
    api.auth.accountLinkRequest.responses[202],
  );
}
