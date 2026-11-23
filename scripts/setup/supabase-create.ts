import { randomBytes } from "node:crypto";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { envValue } from "../lib/db";
import { managementApi } from "./supabase-api";

const NAME = "litreimagined";
const REGION = "ap-south-1";

function setEnv(key: string, value: string) {
  const file = ".env.local";
  const text = readFileSync(file, "utf8");
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(text))
    writeFileSync(
      file,
      text.replace(re, () => `${key}=${value}`),
    );
  else appendFileSync(file, `\n${key}=${value}\n`);
}

async function main() {
  const { call } = managementApi();
  const [org] = await call<{ id: string; slug?: string; name: string }[]>(
    "GET",
    "/organizations",
  );
  const projects = await call<{ id: string; name: string; status: string }[]>(
    "GET",
    "/projects",
  );

  let ref = projects.find((p) => p.name === NAME)?.id;
  if (ref) {
    console.log(`Project "${NAME}" already exists (${ref}); reusing it.`);
  } else {
    const dbPass =
      envValue("SUPABASE_DB_PASSWORD") ?? randomBytes(18).toString("base64url");
    setEnv("SUPABASE_DB_PASSWORD", dbPass);
    const created = await call<{ id: string; ref?: string }>("POST", "/projects", {
      name: NAME,
      organization_slug: org.slug ?? org.id,
      db_pass: dbPass,
      region: REGION,
    });
    ref = created.ref ?? created.id;
    console.log(`Created project "${NAME}" (${ref}) in ${REGION}.`);
  }

  setEnv("SUPABASE_PROJECT_REF", ref);

  // Wait for the database to come up (usually 1-3 minutes).
  for (let i = 0; i < 60; i++) {
    const p = await call<{ status: string }>("GET", `/projects/${ref}`);
    process.stdout.write(`status: ${p.status}\n`);
    if (p.status === "ACTIVE_HEALTHY") return;
    await new Promise((r) => setTimeout(r, 10_000));
  }
  throw new Error("Timed out waiting for the project to become healthy.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
