import { createClient } from "@supabase/supabase-js";
import { envValue, loadEnv } from "../lib/db";

/** Checks row-level security from the point of view of an anonymous visitor. */
async function main() {
  loadEnv();
  const sb = createClient(envValue("NEXT_PUBLIC_SUPABASE_URL")!, envValue("NEXT_PUBLIC_SUPABASE_ANON_KEY")!, {
    auth: { persistSession: false },
  });
  const count = async (t: string) => {
    const { data, error } = await sb.from(t).select("*", { count: "exact", head: false }).limit(1);
    return error ? `error: ${error.message}` : `${data?.length ? "readable" : "empty"}`;
  };
  for (const t of ["books", "authors", "chapters", "collections"]) console.log(t.padEnd(16), await count(t), "(expected readable)");
  for (const t of ["ai_cache", "ai_usage", "profiles", "user_books", "highlights"]) console.log(t.padEnd(16), await count(t), "(expected empty/blocked)");

  const ins = await sb.from("books").insert({ slug: "x", title: "x", author_id: "00000000-0000-0000-0000-000000000000" });
  console.log("anon insert into books:", ins.error ? "blocked ✓" : "ALLOWED ✗");
  const rpc = await sb.rpc("bump_ai_global_usage", { p_feature: "rewrite", p_amount: 1 });
  console.log("anon call bump_ai_global_usage:", rpc.error ? "blocked ✓" : "ALLOWED ✗ (should be restricted)");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
