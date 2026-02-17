/**
 * API client for the Express backend (/api/v1).
 * Uses relative /api/v1 when served from same origin, or VITE_API_BASE_URL in dev.
 */

export const getBaseUrl = (): string => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) {
    return (import.meta.env.VITE_API_BASE_URL as string).replace(/\/$/, "");
  }
  return "/api/v1";
};

const TOKEN_KEY = "jobtracker_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  const token = getToken();
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) (h as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  return h;
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit & { body?: object } = {}
): Promise<T> {
  const base = getBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const { body, ...rest } = options;
  const res = await fetch(url, {
    ...rest,
    headers: { ...authHeaders(), ...(rest.headers as Record<string, string>) },
    body: body !== undefined ? JSON.stringify(body) : rest.body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text ? `${res.status}: ${text}` : res.statusText);
  }
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) return res.json() as Promise<T>;
  return undefined as T;
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  return api<T>(path, { method: "GET" });
}

export async function apiPost<T = unknown>(path: string, body?: object): Promise<T> {
  return api<T>(path, { method: "POST", body });
}

export async function apiPut<T = unknown>(path: string, body?: object): Promise<T> {
  return api<T>(path, { method: "PUT", body });
}

export async function apiDelete(path: string): Promise<void> {
  return api(path, { method: "DELETE" });
}
