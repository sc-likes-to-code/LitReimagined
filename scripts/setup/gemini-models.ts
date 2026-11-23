import { GoogleGenAI } from "@google/genai";
import { envValue, loadEnv } from "../lib/db";

/** Lists the models this API key can use. Listing is free and does not use generation quota. */
async function main() {
  loadEnv();
  const key = envValue("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const ai = new GoogleGenAI({ apiKey: key });
  const rows: { name: string; methods: string[]; input?: number; output?: number }[] = [];
  const pager = await ai.models.list({ config: { pageSize: 200 } });
  for await (const m of pager) {
    rows.push({
      name: (m.name ?? "").replace("models/", ""),
      methods: m.supportedActions ?? [],
      input: m.inputTokenLimit,
      output: m.outputTokenLimit,
    });
  }
  const gen = rows.filter((r) => r.methods.includes("generateContent"));
  const emb = rows.filter((r) => r.methods.includes("embedContent"));
  console.log(`Total models: ${rows.length}`);
  console.log("\nGENERATE (text):");
  for (const r of gen.sort((a, b) => a.name.localeCompare(b.name)))
    console.log(`  ${r.name}  in:${r.input} out:${r.output}`);
  console.log("\nEMBEDDING:");
  for (const r of emb) console.log(`  ${r.name}  in:${r.input}`);
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message.slice(0, 300) : e);
  process.exit(1);
});
