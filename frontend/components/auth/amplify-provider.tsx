"use client";

import { useEffect } from "react";

import { configureAmplify } from "@/lib/amplify";

export function AmplifyProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    configureAmplify();
  }, []);

  return children;
}
