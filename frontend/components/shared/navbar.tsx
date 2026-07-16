"use client";

import Link from "next/link";
import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const links = [
  { label: "Product", href: "#features" },
  { label: "Agents", href: "#agents" },
  { label: "Resources", href: "#dashboard" },
  { label: "Pricing", href: "#cta" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const goToCta = () => document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" });

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="glass mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl px-3 sm:px-4" aria-label="Main navigation">
        <a href="#top" className="flex items-center gap-2 font-semibold tracking-[-0.04em] text-white" aria-label="FounderGPT X home">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-300 to-violet-400 text-slate-950"><Sparkles className="size-4" /></span>
          FounderGPT <span className="text-cyan-300">X</span>
        </a>
        <div className="hidden items-center gap-7 md:flex">{links.map((link) => <a key={link.href} href={link.href} className="text-sm text-slate-400 transition hover:text-white">{link.label}</a>)}</div>
        <div className="hidden items-center gap-2 md:flex"><Link href="/login" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">Sign in</Link><Button onClick={goToCta} className="rounded-lg bg-white px-4 text-slate-950 hover:bg-cyan-50">Get started</Button></div>
        <button type="button" className="grid size-9 place-items-center rounded-lg text-slate-200 hover:bg-white/10 md:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
      </nav>
      {open && <div className="glass mx-auto mt-2 max-w-6xl rounded-2xl p-3 md:hidden"><div className="grid gap-1">{links.map((link) => <a onClick={() => setOpen(false)} key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10">{link.label}</a>)}<Link onClick={() => setOpen(false)} href="/login" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10">Sign in</Link><Button onClick={goToCta} className="mt-2 rounded-lg bg-white text-slate-950">Get started</Button></div></div>}
    </header>
  );
}
