import { readFileSync } from "node:fs";
import { envValue } from "../lib/db";
import { managementApi } from "./supabase-api";

/** Runs a SQL file against the project: npx tsx scripts/setup/supabase-sql.ts <file> */
async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: supabase-sql.ts <file.sql>");
  const { call } = managementApi();
  const ref = envValue("SUPABASE_PROJECT_REF");
  if (!ref) throw new Error("SUPABASE_PROJECT_REF missing");
  await call("POST", `/projects/${ref}/database/query`, {
    query: readFileSync(file, "utf8"),
  });
  console.log(`✓ applied ${file}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
