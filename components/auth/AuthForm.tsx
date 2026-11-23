"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { getBrowserClient } from "@/lib/supabase/browser";

type Mode = "login" | "signup" | "forgot" | "reset";

const COPY: Record<Mode, { title: string; cta: string; sub: string }> = {
  login: {
    title: "Welcome back",
    cta: "Sign in",
    sub: "Pick up exactly where you left off.",
  },
  signup: {
    title: "Create your account",
    cta: "Create account",
    sub: "Keep your place, highlights and notes on every device.",
  },
  forgot: {
    title: "Reset your password",
    cta: "Send reset link",
    sub: "We will email you a link to choose a new one.",
  },
  reset: {
    title: "Choose a new password",
    cta: "Update password",
    sub: "Make it a good one.",
  },
};

function safeNext(v: string | null) {
  return v && v.startsWith("/") && !v.startsWith("//") && !v.includes("\\")
    ? v
    : "/library";
}

const field =
  "bg-surface border-line placeholder:text-faint focus:border-circuit h-12 w-full rounded-2xl border px-4 outline-none transition-colors";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = getBrowserClient();
  const next = safeNext(params.get("next"));
  const copy = COPY[mode];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") ? "That sign-in link did not work. Please try again." : null,
  );
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
        router.refresh();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        if (data.session) {
          router.replace(next);
          router.refresh();
        } else {
          setMessage("Check your inbox to confirm your email, then sign in.");
        }
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (error) throw error;
        setMessage("If that email has an account, a reset link is on its way.");
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage("Password updated. Taking you to your library…");
        setTimeout(() => router.replace("/library"), 900);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (!supabase) return;
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setError(error.message);
  }

  const showEmail = mode !== "reset";
  const showPassword = mode !== "forgot";

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-4xl tracking-tight">{copy.title}</h1>
      <p className="text-muted mt-3">{copy.sub}</p>

      {!supabase && (
        <div
          role="note"
          className="text-circuit border-circuit/30 bg-circuit/10 mt-6 rounded-2xl border p-4 text-sm leading-relaxed"
        >
          Accounts are not connected yet. You can still read, highlight and keep a shelf.
          They are saved in this browser until accounts go live.
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        {showEmail && (
          <label className="block">
            <span className="text-muted mb-1.5 block text-sm">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!supabase}
              placeholder="you@example.com"
              className={field}
            />
          </label>
        )}
        {showPassword && (
          <label className="block">
            <span className="text-muted mb-1.5 block text-sm">
              {mode === "reset" ? "New password" : "Password"}
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!supabase}
              placeholder="At least 8 characters"
              className={field}
            />
          </label>
        )}

        {mode === "login" && (
          <p className="text-right text-sm">
            <Link
              href="/forgot-password"
              className="text-muted hover:text-ink underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </p>
        )}

        {error && (
          <p role="alert" className="text-ember text-sm">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sage text-sm">
            {message}
          </p>
        )}

        <Button type="submit" size="lg" disabled={!supabase || busy} className="w-full">
          {busy ? "One moment…" : copy.cta}
        </Button>
      </form>

      {(mode === "login" || mode === "signup") && (
        <>
          <div className="my-6 flex items-center gap-4 text-xs">
            <span className="bg-line h-px flex-1" />
            <span className="text-faint">or</span>
            <span className="bg-line h-px flex-1" />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={google}
            disabled={!supabase}
            className="w-full"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12S6.8 21.5 12 21.5c5.5 0 9.1-3.8 9.1-9.3 0-.6-.1-1.1-.2-2z"
              />
            </svg>
            Continue with Google
          </Button>
        </>
      )}

      <p className="text-muted mt-8 text-sm">
        {mode === "login" && (
          <>
            New here?{" "}
            <Link href="/signup" className="text-ink underline underline-offset-4">
              Create an account
            </Link>
          </>
        )}
        {mode === "signup" && (
          <>
            Already reading with us?{" "}
            <Link href="/login" className="text-ink underline underline-offset-4">
              Sign in
            </Link>
          </>
        )}
        {(mode === "forgot" || mode === "reset") && (
          <Link href="/login" className="text-ink underline underline-offset-4">
            Back to sign in
          </Link>
        )}
      </p>
    </div>
  );
}
