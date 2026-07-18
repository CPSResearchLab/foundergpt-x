"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check, Eye, EyeOff, Sparkles } from "lucide-react";
import { FormEvent, useState, useEffect } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { isCognitoConfigured } from "@/lib/amplify";
import { signInWithEmail, signUpWithEmail, getAuthenticatedUser } from "@/services/auth";

type AuthMode = "login" | "signup";

const baseSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(12, "Use at least 12 characters for your password."),
});

const signUpSchema = baseSchema
  .extend({
    name: z.string().trim().min(2, "Enter your full name."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return `[${error.name}] ${error.message}`;
  }
  return "[UnknownAuthError] Unable to complete that request. Check the browser console for details.";
}

function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-[-0.04em] text-white">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-violet-400 text-slate-950">
        <Sparkles className="size-4" />
      </span>
      FounderGPT <span className="text-cyan-300">X</span>
    </Link>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
}: {
  label: string;
  name: string;
  type?: "email" | "password" | "text";
  autoComplete: string;
  placeholder: string;
}) {
  const [shown, setShown] = useState(false);
  const password = type === "password";

  return (
    <label className="block text-sm font-medium text-slate-200">
      {label}
      <span className="relative mt-2 block">
        <input
          required
          name={name}
          type={password && shown ? "text" : type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-white/10 bg-white/[.025] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/55 focus:ring-4 focus:ring-cyan-300/10"
        />
        {password && (
          <button
            type="button"
            aria-label={shown ? "Hide password" : "Show password"}
            onClick={() => setShown((value) => !value)}
            className="absolute inset-y-0 right-3 text-slate-500 hover:text-slate-200"
          >
            {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </span>
    </label>
  );
}

export function AuthShell({ mode }: { mode: AuthMode }) {
  const login = mode === "login";
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(login);

  useEffect(() => {
    if (!login || !isCognitoConfigured) {
      setIsCheckingAuth(false);
      return;
    }
    
    let isMounted = true;
    getAuthenticatedUser()
      .then(() => {
        if (isMounted) router.replace("/dashboard");
      })
      .catch(() => {
        if (isMounted) setIsCheckingAuth(false);
      });
      
    return () => {
      isMounted = false;
    };
  }, [login, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);

    if (!isCognitoConfigured) {
      setError("Authentication is not configured for this environment.");
      return;
    }

    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (login) {
      const result = baseSchema.safeParse(values);
      if (!result.success) {
        setError(result.error.issues[0]?.message ?? "Check the form and try again.");
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await signInWithEmail(result.data.email, result.data.password);
        if (!response.isSignedIn) {
          if (response.nextStep.signInStep === "CONFIRM_SIGN_UP") {
            router.push(`/signup/confirm?email=${encodeURIComponent(result.data.email)}`);
            return;
          }
          setError(`Cognito requires an additional sign-in step: ${response.nextStep.signInStep}.`);
          return;
        }
        router.replace("/dashboard");
        router.refresh();
      } catch (caughtError: unknown) {
        if (caughtError && typeof caughtError === "object" && "name" in caughtError && caughtError.name === "UserAlreadyAuthenticatedException") {
          router.replace("/dashboard");
          return;
        }
        setError(errorMessage(caughtError));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const result = signUpSchema.safeParse(values);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await signUpWithEmail({
        email: result.data.email,
        password: result.data.password,
        name: result.data.name,
      });
      if (response.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        router.push(`/signup/confirm?email=${encodeURIComponent(result.data.email)}`);
        return;
      }
      router.replace("/dashboard");
    } catch (caughtError) {
      setError(errorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-[#050914] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[#050914] lg:grid-cols-[1.05fr_.95fr]">
      <div className="glow glow-cyan -left-52 top-1/4" />
      <div className="glow glow-violet -right-52 bottom-0" />
      <section className="relative z-10 flex items-center justify-center px-5 py-12 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="w-full max-w-md">
          <Brand />
          <div className="mt-12">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">{login ? "Welcome back" : "Start building"}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-.055em] text-white">{login ? "Pick up where your ideas left off." : "Your next chapter starts here."}</h1>
            <p className="mt-4 text-sm leading-6 text-slate-400">{login ? "Sign in to your founder workspace and keep building with clarity." : "Create your workspace and meet the AI team built for founders."}</p>
          </div>
          {!isCognitoConfigured && <p role="alert" className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">Authentication is unavailable until Cognito environment variables are configured.</p>}
          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            {!login && <Field label="Full name" name="name" autoComplete="name" placeholder="Alex Morgan" />}
            <Field label="Email address" name="email" type="email" autoComplete="email" placeholder="you@company.com" />
            <Field label="Password" name="password" type="password" autoComplete={login ? "current-password" : "new-password"} placeholder="Enter your password" />
            {!login && <Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Re-enter your password" />}
            {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>}
            <Button type="submit" disabled={isSubmitting || !isCognitoConfigured} className="h-12 w-full rounded-xl bg-white text-sm font-semibold text-slate-950 hover:bg-cyan-50">
              {isSubmitting ? "Please wait..." : login ? "Log in" : "Create account"}
              <ArrowRight className="ml-1" />
            </Button>
          </form>
          <p className="mt-7 text-center text-sm text-slate-500">{login ? "New to FounderGPT X?" : "Already have an account?"} <Link href={login ? "/signup" : "/login"} className="font-medium text-cyan-300 hover:text-cyan-100">{login ? "Create an account" : "Log in"}</Link></p>
        </motion.div>
      </section>
      <aside className="relative hidden overflow-hidden border-l border-white/[.07] bg-white/[.015] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="hero-grid absolute inset-0 opacity-40" />
        <div className="relative glass max-w-md rounded-2xl p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><Sparkles className="size-5" /></span><div><p className="text-sm font-medium text-white">Founder brief ready</p><p className="text-xs text-slate-500">Your AI team has an update</p></div><span className="ml-auto size-2 rounded-full bg-emerald-400" /></div><p className="mt-5 text-sm leading-6 text-slate-300">Your customer interviews point to a clear onboarding opportunity. An experiment is ready for review.</p></div>
        <div className="relative max-w-md"><p className="text-3xl font-medium leading-tight tracking-[-.04em] text-white">The clearest path from ambition to <span className="gradient-text">momentum.</span></p><div className="mt-7 grid grid-cols-2 gap-3">{["Think strategically", "Move faster", "Stay in context", "Build with focus"].map((item) => <div key={item} className="flex items-center gap-2 text-sm text-slate-400"><Check className="size-4 text-cyan-300" />{item}</div>)}</div></div>
      </aside>
    </main>
  );
}
