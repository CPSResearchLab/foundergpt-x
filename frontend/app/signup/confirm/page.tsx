"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { isCognitoConfigured } from "@/lib/amplify";
import { confirmEmailSignUp } from "@/services/auth";

const confirmationSchema = z.object({
  email: z.email("Enter the email address you used to sign up."),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the six-digit code from your email."),
});

function ConfirmSignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const email = searchParams.get("email") ?? "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const values = confirmationSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!values.success) {
      setError(values.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }
    if (!isCognitoConfigured) {
      setError("Authentication is not configured for this environment.");
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmEmailSignUp(values.data.email, values.data.code);
      router.replace("/login");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to confirm your account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050914] px-5 py-12 text-white">
      <section className="glass w-full max-w-md rounded-2xl p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">Confirm your email</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-.05em]">Activate your workspace.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Enter the code Cognito sent to your email address.</p>
        <form onSubmit={submit} noValidate className="mt-8 space-y-5">
          <label className="block text-sm font-medium text-slate-200">Email address<input required name="email" type="email" autoComplete="email" defaultValue={email} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[.025] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/55 focus:ring-4 focus:ring-cyan-300/10" /></label>
          <label className="block text-sm font-medium text-slate-200">Confirmation code<input required name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[.025] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/55 focus:ring-4 focus:ring-cyan-300/10" /></label>
          {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>}
          <Button disabled={isSubmitting || !isCognitoConfigured} className="h-12 w-full rounded-xl bg-white font-semibold text-slate-950 hover:bg-cyan-50">{isSubmitting ? "Confirming..." : "Confirm account"}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">Already confirmed? <Link href="/login" className="font-medium text-cyan-300 hover:text-cyan-100">Log in</Link></p>
      </section>
    </main>
  );
}

export default function ConfirmSignUpPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#050914]" />}>
      <ConfirmSignUpForm />
    </Suspense>
  );
}
