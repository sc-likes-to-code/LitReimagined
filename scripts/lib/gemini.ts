import { GoogleGenAI } from "@google/genai";
import { takeSlot } from "./budget";
import { envValue } from "./db";

export class BudgetExhausted extends Error {
  constructor() {
    super("Daily Gemini budget used up. Re-run tomorrow to resume where this stopped.");
  }
}

const batchModel = () => envValue("GEMINI_MODEL_BATCH") ?? "gemini-2.5-flash-lite";
const embedModel = () => envValue("GEMINI_MODEL_EMBED") ?? "gemini-embedding-001";

let client: GoogleGenAI | null = null;
function ai() {
  const key = envValue("GEMINI_API_KEY");
  if (!key) {
    console.error(
      "GEMINI_API_KEY is not set in .env.local. Re-run with --mock to test the pipeline without it.",
    );
    process.exit(1);
  }
  client ??= new GoogleGenAI({ apiKey: key });
  return client;
}

function retryDelayMs(err: unknown): number | null {
  const msg = err instanceof Error ? err.message : String(err);
  if (!/429|RESOURCE_EXHAUSTED|503|UNAVAILABLE|overloaded/i.test(msg)) return null;
  const m = /retry in ([\d.]+)s/i.exec(msg) ?? /"retryDelay":"(\d+)s"/.exec(msg);
  return m ? Math.ceil(Number(m[1]) * 1000) + 1000 : 20_000;
}

/** One throttled, retried JSON generation call. */
export async function generateJson<T>(
  system: string,
  prompt: string,
  validate: (v: unknown) => T,
): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (!(await takeSlot())) throw new BudgetExhausted();
    try {
      const res = await ai().models.generateContent({
        model: batchModel(),
        contents: prompt,
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          temperature: 0.5,
          maxOutputTokens: 16000,
        },
      });
      const text = res.text?.trim();
      if (!text) throw new Error("empty response");
      return validate(JSON.parse(text));
    } catch (err) {
      const wait = retryDelayMs(err);
      if (wait !== null && attempt < 3) {
        console.warn(`   rate limited, waiting ${Math.round(wait / 1000)}s…`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (attempt >= 3 || wait === null) throw err;
    }
  }
  throw new Error("unreachable");
}

export async function embedText(text: string, dims = 768): Promise<number[]> {
  if (!(await takeSlot())) throw new BudgetExhausted();
  const res = await ai().models.embedContent({
    model: embedModel(),
    contents: text,
    config: { outputDimensionality: dims },
  });
  const v = res.embeddings?.[0]?.values;
  if (!v) throw new Error("no embedding returned");
  return v;
}

export { batchModel };
