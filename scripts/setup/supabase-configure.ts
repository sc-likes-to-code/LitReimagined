import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { envValue } from "../lib/db";
import { managementApi } from "./supabase-api";

function setEnv(key: string, value: string) {
  const file = ".env.local";
  const text = readFileSync(file, "utf8");
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(text)) writeFileSync(file, text.replace(re, () => `${key}=${value}`));
  else appendFileSync(file, `\n${key}=${value}\n`);
}

type ApiKey = { name: string; api_key?: string; type?: string };

async function main() {
  const { call } = managementApi();
  const ref = envValue("SUPABASE_PROJECT_REF");
  if (!ref) throw new Error("SUPABASE_PROJECT_REF missing; run supabase-create first");

  // 1. Keys. Legacy anon/service_role JWTs work with every Supabase client library.
  const keys = await call<ApiKey[]>("GET", `/projects/${ref}/api-keys?reveal=true`);
  const anon = keys.find((k) => k.name === "anon")?.api_key;
  const service = keys.find((k) => k.name === "service_role")?.api_key;
  if (!anon || !service) throw new Error(`Could not read keys (got: ${keys.map((k) => k.name).join(", ")})`);
  setEnv("NEXT_PUBLIC_SUPABASE_URL", `https://${ref}.supabase.co`);
  setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", anon);
  setEnv("SUPABASE_SERVICE_ROLE_KEY", service);
  console.log("✓ keys written to .env.local");

  // 2. Auth URLs.
  await call("PATCH", `/projects/${ref}/config/auth`, {
    site_url: "http://localhost:3000",
    uri_allow_list: "http://localhost:3000/**",
  });
  console.log("✓ auth redirect URLs set");

  // 3. Migration.
  const sql = readFileSync("supabase/migrations/20261123000000_init.sql", "utf8");
  await call("POST", `/projects/${ref}/database/query`, { query: sql });
  console.log("✓ migration applied");

  const check = await call<{ table_name: string }[]>("POST", `/projects/${ref}/database/query`, {
    query: "select table_name from information_schema.tables where table_schema='public' order by 1",
  });
  console.log("tables:", check.map((t) => t.table_name).join(", "));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
