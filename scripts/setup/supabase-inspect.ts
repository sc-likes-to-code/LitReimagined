import { managementApi } from "./supabase-api";

async function main() {
  const { call } = managementApi();
  const orgs = await call<{ id: string; slug?: string; name: string }[]>("GET", "/organizations");
  console.log("Organizations:", orgs.map((o) => `${o.name} (${o.slug ?? o.id})`).join(", ") || "none");
  const projects = await call<{ id: string; name: string; region: string; status: string; organization_id?: string }[]>("GET", "/projects");
  console.log("Projects:", projects.length ? projects.map((p) => `${p.name} [${p.region}, ${p.status}]`).join("; ") : "none");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
