import { envValue, loadEnv } from "../lib/db";

/** Minimal client for the Supabase Management API. The token is read from .env.local and never printed. */
export function managementApi() {
  loadEnv();
  const token = envValue("SUPABASE_ACCESS_TOKEN");
  if (!token) {
    console.error("SUPABASE_ACCESS_TOKEN is empty in .env.local");
    process.exit(1);
  }
  const base = "https://api.supabase.com/v1";

  async function call<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json: unknown = text;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* keep text */
    }
    if (!res.ok) {
      throw new Error(`${method} ${path} -> ${res.status}: ${typeof json === "string" ? json : JSON.stringify(json)}`);
    }
    return json as T;
  }
  return { call };
}
