import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Login", robots: { index: false } };

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="bg-surface h-96 w-full max-w-sm animate-pulse rounded-3xl" />
      }
    >
      <AuthForm mode="login" />
    </Suspense>
  );
}
