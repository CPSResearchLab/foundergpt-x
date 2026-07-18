"use client";

import { Plus } from "lucide-react";
import { ProjectSearch } from "./ProjectSearch";

interface ProjectHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNewProject: () => void;
}

export function ProjectHeader({ searchQuery, onSearchChange, onNewProject }: ProjectHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-.05em] text-white sm:text-4xl">
          Projects
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage your startup workspaces and initiatives.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
        <ProjectSearch value={searchQuery} onChange={onSearchChange} />
        <button 
          onClick={onNewProject}
          className="flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-slate-950 hover:bg-cyan-50 transition-colors"
        >
          <Plus className="size-4" /> New Project
        </button>
      </div>
    </div>
  );
}
