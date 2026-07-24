"use client";

import { motion } from "framer-motion";
import { Bell, Bot, BrainCircuit, ChevronRight, FileText, FolderKanban, LayoutDashboard, Menu, MessageSquare, MoreHorizontal, Plus, Search, Settings, Sparkles, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getProjects } from "@/services/projects";
import { getAllChatSessions } from "@/services/chat";
import { getMemoryEntryCount } from "@/services/memory/memory";
import { getUserDisplayName } from "@/services/auth";

const NAV_ITEMS: [React.ElementType, string, string][] = [
  [LayoutDashboard, "Dashboard", "/dashboard"],
  [FolderKanban, "Projects", "/projects"],
  [MessageSquare, "AI Chat", "/chat"],
  [Bot, "Agents", "/agents"],
  [FileText, "Documents", "/documents"],
  [BrainCircuit, "Memory", "/memory"],
  [Settings, "Settings", "/settings"],
];

const QUICK_ACTIONS: [React.ElementType, string, string][] = [
  [Sparkles, "Generate Pitch Deck", "Turn your vision into a compelling story."],
  [FileText, "Business Plan", "Build a practical, investor-ready plan."],
  [Zap, "Financial Model", "Map the numbers behind your ambition."],
  [Bot, "Marketing Plan", "Find the channel and message that fit."],
];

interface Metrics {
  projects: number;
  documents: number;
  chats: number;
  memory: number;
}

/** Returns up to 2 uppercase initials from a display name, e.g. "Alex Morgan" → "AM". */
function getInitials(name: string | null): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2 font-semibold tracking-[-.04em] text-white">
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-300 to-violet-400 text-slate-950">
        <Sparkles className="size-4" />
      </span>
      FounderGPT <span className="text-cyan-300">X</span>
    </div>
  );
}

function Sidebar({ close }: { close?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  function navigate(href: string) {
    if (close) close();
    router.push(href);
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/[.07] bg-[#080d1b] p-4">
      <Brand />
      <nav className="mt-9 space-y-1" aria-label="Dashboard navigation">
        {NAV_ITEMS.map(([Icon, label, href]) => (
          <button
            key={href}
            onClick={() => navigate(href)}
            className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition ${
              pathname === href
                ? "bg-white/[.08] text-white"
                : "text-slate-500 hover:bg-white/[.05] hover:text-slate-200"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-cyan-300/10 bg-gradient-to-br from-cyan-300/[.09] to-violet-400/[.08] p-4">
        <Sparkles className="size-4 text-cyan-200" />
        <p className="mt-3 text-sm font-medium text-white">Your founder brief is ready.</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Three insights are waiting for you.</p>
        <button
          onClick={() => navigate("/chat")}
          className="mt-3 text-xs font-medium text-cyan-200 hover:text-white"
        >
          View brief <ChevronRight className="inline size-3" />
        </button>
      </div>
    </aside>
  );
}

function MetricCard({
  Icon,
  name,
  value,
  color,
  href,
  index,
}: {
  Icon: React.ElementType;
  name: string;
  value: string;
  color: string;
  href: string;
  index: number;
}) {
  const router = useRouter();
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass cursor-pointer rounded-2xl p-4 transition hover:bg-white/[.04]"
      onClick={() => router.push(href)}
    >
      <div className="flex items-center justify-between">
        <span className={`grid size-9 place-items-center rounded-xl bg-white/[.045] ${color}`}>
          <Icon className="size-4" />
        </span>
        <MoreHorizontal className="size-4 text-slate-600" />
      </div>
      <p className="mt-5 text-2xl font-medium tracking-[-.04em] text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{name}</p>
    </motion.article>
  );
}

export function DashboardUI() {
  const [menu, setMenu] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>({ projects: 0, documents: 0, chats: 0, memory: 0 });
  const [displayName, setDisplayName] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const [projects, sessions, name] = await Promise.all([
        getProjects(),
        getAllChatSessions(),
        getUserDisplayName(),
      ]);
      const memoryCount = getMemoryEntryCount();
      setMetrics({
        projects: projects.length,
        documents: 0,
        chats: sessions.length,
        memory: memoryCount,
      });
      setDisplayName(name ?? null);
    }
    void loadData();
  }, []);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
  const initials = getInitials(displayName);

  const metricCards: { Icon: React.ElementType; name: string; value: string; color: string; href: string }[] = [
    { Icon: FolderKanban, name: "Projects", value: String(metrics.projects), color: "text-cyan-200", href: "/projects" },
    { Icon: FileText, name: "Generated documents", value: String(metrics.documents), color: "text-violet-200", href: "/documents" },
    { Icon: MessageSquare, name: "AI chats", value: String(metrics.chats), color: "text-sky-200", href: "/chat" },
    { Icon: BrainCircuit, name: "Memory entries", value: String(metrics.memory), color: "text-fuchsia-200", href: "/memory" },
  ];

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const q = searchRef.current?.value.trim();
      router.push(q ? `/projects?search=${encodeURIComponent(q)}` : "/projects");
    }
  }

  return (
    <main className="min-h-screen bg-[#050914] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,.1),transparent_26%),radial-gradient(circle_at_20%_100%,rgba(139,92,246,.1),transparent_25%)]" />

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setMenu(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="relative h-full w-64">
            <Sidebar close={() => setMenu(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[.07] bg-[#050914]/80 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenu(true)}
              className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-white/5 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" />
              <input
                ref={searchRef}
                placeholder="Search anything..."
                onKeyDown={handleSearchKeyDown}
                className="h-9 w-56 rounded-lg border border-white/[.08] bg-white/[.025] pl-9 text-xs text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/chat")}
              className="relative grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-white/5"
              aria-label="Go to AI Chat"
            >
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-cyan-300" />
            </button>
            <button
              onClick={() => router.push("/settings")}
              className="size-8 rounded-full bg-gradient-to-br from-cyan-300 to-violet-400 p-px"
              aria-label="Go to Settings"
            >
              <div className="grid size-full place-items-center rounded-full bg-slate-900 text-xs font-medium">
                {initials}
              </div>
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
          {/* Welcome row */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm text-slate-500">{today}</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-[-.05em] sm:text-4xl">
                  {displayName ? `Welcome back, ${displayName}.` : "Welcome back!"}
                </h1>
                <p className="mt-2 text-sm text-slate-400">Here&apos;s what&apos;s moving in your company today.</p>
              </div>
              <Button
                onClick={() => router.push("/projects?new=true")}
                className="h-10 rounded-xl bg-white text-slate-950 hover:bg-cyan-50"
              >
                <Plus /> New project
              </Button>
            </div>
          </motion.div>

          {/* Metric cards */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((card, i) => (
              <MetricCard key={card.name} {...card} index={i} />
            ))}
          </div>

          {/* Health score + Quick actions */}
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.18fr_.82fr]">
            <article className="glass rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">Founder signal</p>
                  <h2 className="mt-2 text-xl font-medium tracking-[-.03em]">Startup health score</h2>
                </div>
                <div className="grid size-20 place-items-center rounded-full border-[7px] border-cyan-300/20 text-xl font-semibold text-cyan-100">
                  84
                </div>
              </div>
              <p className="mt-5 max-w-xl text-sm leading-6 text-slate-400">
                You&apos;re building momentum. Customer insight and execution cadence are strong; sharpen your activation loop to unlock the next level.
              </p>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/[.06]">
                <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-cyan-400 to-violet-400" />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Strategy", "Velocity", "Customer insight"].map((x) => (
                  <span key={x} className="rounded-md bg-white/[.05] px-2.5 py-1 text-xs text-slate-400">{x}</span>
                ))}
              </div>
            </article>

            <article className="glass rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium">Quick actions</h2>
                <Sparkles className="size-4 text-violet-300" />
              </div>
              <div className="mt-4 grid gap-2">
                {QUICK_ACTIONS.map(([Icon, title, description]) => (
                  <button
                    key={title as string}
                    onClick={() => router.push("/projects")}
                    className="group flex items-center gap-3 rounded-xl p-2 text-left hover:bg-white/[.045]"
                  >
                    <span className="grid size-8 place-items-center rounded-lg bg-white/[.05] text-cyan-200">
                      <Icon className="size-4" />
                    </span>
                    <span>
                      <span className="block text-sm text-slate-200">{title as string}</span>
                      <span className="block text-xs text-slate-500">{description as string}</span>
                    </span>
                    <ChevronRight className="ml-auto size-4 text-slate-600 group-hover:text-cyan-200" />
                  </button>
                ))}
              </div>
            </article>
          </div>

          {/* Recent activity + Recent documents */}
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <article className="glass rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium">Recent activity</h2>
                <button
                  onClick={() => router.push("/chat")}
                  className="text-xs text-cyan-300 hover:text-white"
                >
                  View all
                </button>
              </div>
              <div className="mt-4 space-y-4">
                {[
                  ["Research Agent", "identified 3 patterns from customer calls", "12 min ago"],
                  ["You", "created a new project: Onboarding refresh", "1h ago"],
                  ["Growth Agent", "completed your channel experiment brief", "3h ago"],
                ].map(([name, action, time]) => (
                  <div key={time} className="flex gap-3">
                    <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-violet-400/15 text-[10px] font-semibold text-violet-200">
                      {name === "You" ? initials : "AI"}
                    </span>
                    <p className="text-sm leading-5 text-slate-400">
                      <span className="font-medium text-slate-200">{name}</span> {action}
                      <span className="ml-2 whitespace-nowrap text-xs text-slate-600">{time}</span>
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="glass rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium">Recent documents</h2>
                <button
                  onClick={() => router.push("/documents")}
                  className="text-xs text-cyan-300 hover:text-white"
                >
                  Open library
                </button>
              </div>
              <div className="mt-4 divide-y divide-white/[.06]">
                {[
                  ["Investor narrative v2", "Strategy", "Edited 24 min ago"],
                  ["Q3 growth experiment", "Growth", "Generated yesterday"],
                  ["Customer interview synthesis", "Research", "Edited yesterday"],
                ].map(([name, tag, time]) => (
                  <div
                    key={name}
                    className="flex cursor-pointer items-center gap-3 py-3 first:pt-0 hover:bg-white/[.02]"
                    onClick={() => router.push("/documents")}
                  >
                    <span className="grid size-8 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200">
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-200">{name}</p>
                      <p className="mt-1 text-xs text-slate-600">{tag} · {time}</p>
                    </div>
                    <ChevronRight className="ml-auto size-4 text-slate-600" />
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
