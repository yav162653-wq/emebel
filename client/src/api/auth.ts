import { api, type InsertUser, type LoginRequest, type User } from "@shared/routes";
import { apiFetch } from "./http";

export async function fetchCurrentUser(): Promise<User | null> {
  const res = await apiFetch(api.auth.me.path);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch user");
  return await res.json() as User;
}

export async function login(credentials: LoginRequest): Promise<User> {
  const res = await apiFetch(api.auth.login.path, {
    method: api.auth.login.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Invalid credentials");
    throw new Error("Login failed");
  }
  return await res.json() as User;
}

export async function register(data: InsertUser): Promise<User> {
  const res = await apiFetch(api.auth.register.path, {
    method: api.auth.register.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Registration failed");
  }
  return await res.json() as User;
}

export async function logout(): Promise<void> {
  await apiFetch(api.auth.logout.path, { method: api.auth.logout.method });
}

export async function requestMagicLink(
  email: string,
): Promise<{ message: string }> {
  const res = await apiFetch(api.auth.magicLinkRequest.path, {
    method: api.auth.magicLinkRequest.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not request a sign-in link");
  return data;
}

export async function consumeAuthLink(
  kind: "magic" | "account",
  token: string,
): Promise<User> {
  const path = kind === "magic"
    ? "/api/auth/magic-link/consume"
    : "/api/auth/account-link/consume";
  const res = await apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "This link is invalid or expired.");
  return data as User;
}
