import { apiFetch, apiRequest } from "./http";

export async function updateProfile(name: string) {
  const res = await apiRequest("PATCH", "/api/auth/profile", { name });
  return res.json();
}

export async function requestAccountLink(email: string) {
  const res = await apiFetch("/api/auth/account-link/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not send confirmation email");
  return data;
}
