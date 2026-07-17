"use client";

import { configureAmplify } from "@/lib/amplify";

if (typeof window !== "undefined") {
  configureAmplify();
}

export function AmplifyProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
