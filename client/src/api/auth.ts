import { api, type LoginRequest, type RegisterRequest, type User } from "@shared/routes";
import { apiFetch, apiRequest, apiRequestJson, apiResponseJson } from "./http";

export async function fetchCurrentUser(): Promise<User | null> {
  const res = await apiFetch(api.auth.me.path);
  if (res.status === 401) return null;
  return apiResponseJson(res, api.auth.me.responses[200]);
}

export async function login(credentials: LoginRequest): Promise<User> {
  const input = api.auth.login.input.parse(credentials);
  return apiRequestJson(
    api.auth.login.method,
    api.auth.login.path,
    input,
    api.auth.login.responses[200],
  );
}

export async function register(data: RegisterRequest): Promise<User> {
  const input = api.auth.register.input.parse(data);
  return apiRequestJson(
    api.auth.register.method,
    api.auth.register.path,
    input,
    api.auth.register.responses[201],
  );
}

export async function logout(): Promise<void> {
  await apiRequest(api.auth.logout.method, api.auth.logout.path);
}

export async function requestMagicLink(
  email: string,
): Promise<{ message: string }> {
  const input = api.auth.magicLinkRequest.input.parse({ email });
  return apiRequestJson(
    api.auth.magicLinkRequest.method,
    api.auth.magicLinkRequest.path,
    input,
    api.auth.magicLinkRequest.responses[202],
  );
}

export async function consumeAuthLink(
  kind: "magic" | "account",
  token: string,
): Promise<User> {
  const endpoint = kind === "magic"
    ? api.auth.magicLinkConsume
    : api.auth.accountLinkConsume;
  const input = endpoint.input.parse({ token });
  return apiRequestJson(
    endpoint.method,
    endpoint.path,
    input,
    endpoint.responses[200],
  );
}
