"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export type SpeechStatus = "idle" | "playing" | "paused";
export const SPEECH_RATES = [0.85, 1, 1.25, 1.5] as const;

const subscribeNothing = () => () => {};

/** True when the browser can speak text. False on the server, so markup always matches. */
export function useSpeechSupported(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined",
    () => false,
  );
}

/** Splits a paragraph into sentence-sized chunks; browsers cut off very long utterances. */
export function speechChunks(text: string, max = 200): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]+["”’)\]]*\s*|[^.!?…]+$/g) ?? [text];
  const out: string[] = [];
  let current = "";
  for (const s of sentences) {
    if (current && (current + s).length > max) {
      out.push(current.trim());
      current = s;
    } else current += s;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

/** Picks the nicest English voice the device offers. */
function pickVoice(): SpeechSynthesisVoice | undefined {
  const english = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("en"));
  return (
    english.find((v) => /natural|neural/i.test(v.name)) ??
    english.find((v) => /google (uk|us) english/i.test(v.name)) ??
    english.find((v) => v.default) ??
    english[0]
  );
}

/**
 * Reads a list of paragraphs aloud with the browser's own voice (free, no AI quota).
 * Pausing stops and resumes from the start of the current paragraph, which behaves
 * the same on every browser.
 */
export function useReadAloud(paragraphs: string[]) {
  const supported = useSpeechSupported();
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [current, setCurrent] = useState<number | null>(null);
  const [rate, setRateState] = useState<number>(1);

  const parasRef = useRef(paragraphs);
  const rateRef = useRef(1);
  const run = useRef(0);

  useEffect(() => {
    parasRef.current = paragraphs;
  }, [paragraphs]);

  const start = useCallback((from: number, withRate?: number) => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const paras = parasRef.current;
    const first = Math.min(Math.max(0, from), paras.length - 1);
    if (paras.length === 0) return;

    synth.cancel();
    const id = ++run.current;
    const voice = pickVoice();
    const speed = withRate ?? rateRef.current;

    for (let i = first; i < paras.length; i++) {
      const parts = speechChunks(paras[i]);
      parts.forEach((part, k) => {
        const u = new SpeechSynthesisUtterance(part);
        u.rate = speed;
        u.lang = voice?.lang ?? "en";
        if (voice) u.voice = voice;
        if (k === 0) u.onstart = () => run.current === id && setCurrent(i);
        if (i === paras.length - 1 && k === parts.length - 1) {
          u.onend = () => {
            if (run.current !== id) return;
            setStatus("idle");
            setCurrent(null);
          };
        }
        u.onerror = (e) => {
          if (run.current !== id) return;
          if (e.error === "canceled" || e.error === "interrupted") return;
          setStatus("idle");
          setCurrent(null);
        };
        synth.speak(u);
      });
    }
    setStatus("playing");
    setCurrent(first);
  }, []);

  const stop = useCallback(() => {
    run.current++;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setStatus("idle");
    setCurrent(null);
  }, []);

  const pause = useCallback(() => {
    run.current++;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setStatus("paused");
  }, []);

  const resume = useCallback(() => start(current ?? 0), [start, current]);

  const setRate = useCallback(
    (r: number) => {
      rateRef.current = r;
      setRateState(r);
      if (status === "playing") start(current ?? 0, r);
    },
    [start, status, current],
  );

  // Stop talking when the reader goes away.
  useEffect(() => {
    return () => {
      // `run` is a plain counter, not a DOM node, so reading it at cleanup time is intended.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      run.current++;
      if (typeof window !== "undefined" && "speechSynthesis" in window)
        window.speechSynthesis.cancel();
    };
  }, []);

  return { supported, status, current, rate, start, stop, pause, resume, setRate };
}
