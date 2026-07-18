"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MessageSquare, FileText, BrainCircuit, Bot, Settings, LineChart } from "lucide-react";
import { DashboardAuthGate } from "@/components/auth/dashboard-auth-gate";
import { Project, getProject } from "@/services/projects";

const featureCards = [
  { id: "chat", title: "AI Chat", description: "Talk to your project's AI assistant", icon: MessageSquare, color: "text-sky-300", bg: "from-sky-300/[.08] to-cyan-300/[.02]" },
  { id: "documents", title: "Documents", description: "Manage pitch decks, business plans & memos", icon: FileText, color: "text-violet-300", bg: "from-violet-300/[.08] to-fuchsia-300/[.02]" },
  { id: "memory", title: "Memory", description: "View what the AI has learned about this project", icon: BrainCircuit, color: "text-fuchsia-300", bg: "from-fuchsia-300/[.08] to-pink-300/[.02]" },
  { id: "agents", title: "Agents", description: "Configure specialized agents for specific tasks", icon: Bot, color: "text-emerald-300", bg: "from-emerald-300/[.08] to-teal-300/[.02]" },
  { id: "analytics", title: "Analytics", description: "Track key performance metrics and traction", icon: LineChart, color: "text-amber-300", bg: "from-amber-300/[.08] to-orange-300/[.02]" },
  { id: "settings", title: "Settings", description: "Manage project details and preferences", icon: Settings, color: "text-slate-300", bg: "from-slate-300/[.08] to-slate-400/[.02]" }
];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    async function load() {
      if (!id) return;
      const data = await getProject(id);
      setProject(data);
      setIsLoading(false);
    }
    load();
  }, [id]);

  if (isLoading) {
    return (
      <DashboardAuthGate>
        <main className="min-h-screen bg-[#050914] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
        </main>
      </DashboardAuthGate>
    );
  }

  if (!project) {
    return (
      <DashboardAuthGate>
        <main className="min-h-screen bg-[#050914] text-white flex flex-col items-center justify-center p-5">
          <h1 className="text-2xl font-medium">Project not found</h1>
          <p className="mt-2 text-slate-400 text-center max-w-sm">The project you are looking for does not exist or has been deleted.</p>
          <button 
            onClick={() => router.push("/projects")}
            className="mt-6 flex items-center gap-2 text-cyan-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" /> Back to Projects
          </button>
        </main>
      </DashboardAuthGate>
    );
  }

  return (
    <DashboardAuthGate>
      <main className="min-h-screen bg-[#050914] text-white">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,.05),transparent_26%),radial-gradient(circle_at_20%_100%,rgba(139,92,246,.05),transparent_25%)]" />
        
        <div className="lg:pl-64">
          <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-10">
            <button 
              onClick={() => router.push("/projects")}
              className="group flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
              Back to Projects
            </button>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-semibold tracking-[-.05em] sm:text-5xl">
                    {project.name}
                  </h1>
                  {project.industry && (
                    <span className="mt-3 inline-block rounded-md bg-white/[.05] px-2.5 py-1 text-sm text-slate-300 border border-white/[.08]">
                      {project.industry}
                    </span>
                  )}
                  <p className="mt-4 text-base text-slate-400 max-w-2xl leading-relaxed">
                    {project.description || "No description provided."}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex items-center gap-6 text-sm text-slate-500 border-t border-white/[.04] pt-6">
                <p>Created: <span className="text-slate-300">{new Date(project.createdAt).toLocaleDateString()}</span></p>
                <p>Updated: <span className="text-slate-300">{new Date(project.updatedAt).toLocaleDateString()}</span></p>
              </div>
            </motion.div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featureCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.article 
                    key={card.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass group relative overflow-hidden rounded-2xl p-6 hover:bg-white/[.04] transition-colors cursor-pointer"
                    onClick={() => {
                      if (card.id === "chat") {
                        router.push(`/projects/${id}/chat`);
                      } else {
                        console.log(`Navigate to ${card.id}`);
                      }
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity group-hover:opacity-100 ${card.bg}`} />
                    <div className="relative">
                      <span className={`grid size-12 place-items-center rounded-xl bg-white/[.05] ${card.color}`}>
                        <Icon className="size-6" />
                      </span>
                      <h3 className="mt-5 text-xl font-medium tracking-[-.02em] text-white">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
                        {card.description}
                      </p>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </DashboardAuthGate>
  );
}
