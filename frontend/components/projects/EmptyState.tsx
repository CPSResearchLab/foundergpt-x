"use client";

import { motion } from "framer-motion";
import { FolderKanban, Plus } from "lucide-react";

interface EmptyStateProps {
  onNewProject: () => void;
  isSearch: boolean;
}

export function EmptyState({ onNewProject, isSearch }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center rounded-3xl border border-white/[.04] bg-white/[.01] py-24 px-5 text-center"
    >
      <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300/[.08] to-violet-400/[.08] text-cyan-200">
        <FolderKanban className="size-8" />
      </div>
      <h3 className="mt-6 text-xl font-medium text-white">
        {isSearch ? "No projects found" : "No projects yet"}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        {isSearch 
          ? "We couldn't find any projects matching your search." 
          : "Create your first startup workspace to organize documents, agents, and memory."}
      </p>
      
      {!isSearch && (
        <button 
          onClick={onNewProject}
          className="mt-8 flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-50 transition-colors shadow-lg shadow-white/5"
        >
          <Plus className="size-4" /> Create your first startup
        </button>
      )}
    </motion.div>
  );
}
