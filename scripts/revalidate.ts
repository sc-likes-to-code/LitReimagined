/** Tells the running site to refresh its cached catalogue. `npm run content:revalidate` */
import { envValue, loadEnv } from "./lib/db";

async function main() {
  loadEnv();
  const site = envValue("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000";
  const secret = envValue("REVALIDATE_SECRET");
  if (!secret) {
    console.error("Set REVALIDATE_SECRET in .env.local (and on the server) first.");
    process.exit(1);
  }
  const res = await fetch(`${site}/api/revalidate`, {
    method: "POST",
    headers: { "x-revalidate-secret": secret },
  });
  console.log(res.ok ? `Revalidated ${site}` : `Failed: ${res.status}`);
  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
