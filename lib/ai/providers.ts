import "server-only";
import { GoogleGenAI } from "@google/genai";
import { getModels } from "@/config/ai";
import type { AiFeature } from "@/config/ai";
import { getServerEnv } from "@/lib/env";
import type { AiProvider } from "./types";

class GeminiProvider implements AiProvider {
  readonly name = "gemini" as const;
  readonly demo = false;
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generate({
    prompt,
    system,
    json,
    feature,
  }: Parameters<AiProvider["generate"]>[0]) {
    const model = getModels().live;
    const res = await this.ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: system,
        temperature: feature === "explain" ? 0.4 : 0.8,
        maxOutputTokens: 700,
        ...(json ? { responseMimeType: "application/json" } : {}),
      },
    });
    const text = res.text?.trim();
    if (!text) throw new Error("Empty response from model");
    return text;
  }

  async embed(text: string) {
    const { embed, embedDimensions } = getModels();
    const res = await this.ai.models.embedContent({
      model: embed,
      contents: text,
      config: { outputDimensionality: embedDimensions },
    });
    return res.embeddings?.[0]?.values ?? null;
  }
}

/** Deterministic placeholder replies so every flow is testable without a key. */
class MockProvider implements AiProvider {
  readonly name = "mock" as const;
  readonly demo = true;

  async generate({
    feature,
    prompt,
  }: {
    feature: AiFeature;
    prompt: string;
    json?: boolean;
  }) {
    await new Promise((r) => setTimeout(r, 450));
    if (feature === "rewrite") {
      const passage = /PASSAGE:\n([\s\S]*?)\n\nSTYLE:/.exec(prompt)?.[1]?.trim() ?? "";
      const style = /STYLE: (.*)/.exec(prompt)?.[1] ?? "plain";
      return `[Demo, ${style}] ${passage.length > 220 ? passage.slice(0, 220) + "…" : passage}`;
    }
    if (feature === "explain") {
      return JSON.stringify({
        meaning:
          "This is a demo explanation. With a Gemini key connected, you will see a plain-English reading of the selected line here.",
        note: "Demo mode: no model was called.",
      });
    }
    return JSON.stringify({ picks: [] });
  }

  async embed() {
    return null;
  }
}

export function getProvider(): AiProvider {
  const key = getServerEnv().geminiApiKey;
  return key ? new GeminiProvider(key) : new MockProvider();
}
