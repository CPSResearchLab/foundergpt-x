"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-5 pb-16 pt-32 sm:px-8 sm:pb-24 lg:pt-44">
      <div className="hero-grid pointer-events-none absolute inset-0 -z-20 opacity-70" />
      <div className="glow glow-cyan -left-48 top-6" />
      <div className="glow glow-violet right-[-12rem] top-24" />
      <div className="relative mx-auto max-w-6xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}
          className="glass mx-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-slate-200"
        >
          <Sparkles className="size-3.5 text-cyan-300" /> The AI operating system for ambitious founders
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08 }}
          className="mx-auto mt-7 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.065em] text-white sm:text-7xl lg:text-[5.8rem] lg:leading-[0.98]"
        >
          From first thought to <span className="gradient-text">founder flow.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.17 }}
          className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-7 text-slate-400 sm:text-lg"
        >
          FounderGPT X gives you an expert AI team that researches, strategizes, builds, and remembers—so your best ideas move at the speed of conviction.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.28 }} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button className="h-12 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 hover:bg-cyan-50" onClick={() => document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" })}>
            Start building <ArrowRight className="ml-1" />
          </Button>
          <Button variant="outline" className="h-12 rounded-xl border-white/15 bg-white/[0.03] px-5 text-slate-100 hover:border-white/25 hover:bg-white/[0.08]" onClick={() => document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" })}>
            <Play className="fill-current" /> See it in action
          </Button>
        </motion.div>
        <p className="mt-5 text-xs text-slate-500">No credit card required · Set up in under two minutes</p>
      </div>
    </section>
  );
}
