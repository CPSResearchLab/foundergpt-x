"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { isCognitoConfigured } from "@/lib/amplify";
import { getAuthenticatedUser, getSession, signOutUser } from "@/services/auth";

export function DashboardAuthGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    async function verifySession() {
      if (!isCognitoConfigured) {
        console.error("[auth] dashboard access denied: Cognito is not configured.");
        router.replace("/login");
        return;
      }

      try {
        const [session] = await Promise.all([getSession(), getAuthenticatedUser()]);
        if (!session.tokens) {
          throw new Error("Cognito did not return user-pool tokens.");
        }
        setIsAuthenticated(true);
      } catch (error: unknown) {
        console.error("[auth] dashboard access denied", error);
        router.replace("/login");
      } finally {
        setIsCheckingSession(false);
      }
    }

    void verifySession();
  }, [router]);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOutUser();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isCheckingSession || !isAuthenticated) {
    return <main className="min-h-screen bg-[#050914]" aria-busy="true" />;
  }

  return (
    <>
      {children}
      <button
        className="fixed bottom-5 right-5 z-50 rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        disabled={isSigningOut}
        onClick={() => void handleSignOut()}
        type="button"
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>
    </>
  );
}
