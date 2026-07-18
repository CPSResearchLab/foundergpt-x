"use client";

import { motion } from "framer-motion";
import { FolderKanban, MoreHorizontal, ChevronRight, Edit2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Project } from "@/services/projects";
import { useState, useRef, useEffect } from "react";

interface ProjectCardProps {
  project: Project;
  onRename: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectCard({ project, onRename, onDelete }: ProjectCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const createdDate = new Date(project.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <motion.article 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 sm:p-6 flex flex-col h-full relative"
    >
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
          <FolderKanban className="size-5" />
        </span>
        <div className="relative" ref={menuRef}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }} 
            className="p-1 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-white/5 transition-colors"
          >
            <MoreHorizontal className="size-5" />
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-white/[.08] bg-[#080d1b] p-1 shadow-xl z-20">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onRename(project);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-white/5"
              >
                <Edit2 className="size-4" /> Rename
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete(project);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-red-400 hover:bg-white/5 hover:text-red-300"
              >
                <Trash2 className="size-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-5 flex-grow">
        <h3 className="text-xl font-medium tracking-[-.03em] text-white truncate">
          {project.name}
        </h3>
        {project.industry && (
          <span className="mt-2 inline-block rounded-md bg-white/[.05] px-2 py-0.5 text-xs text-slate-400">
            {project.industry}
          </span>
        )}
        <p className="mt-3 text-sm leading-relaxed text-slate-400 line-clamp-2">
          {project.description || "No description provided."}
        </p>
      </div>
      
      <div className="mt-6 flex items-center justify-between border-t border-white/[.04] pt-4">
        <p className="text-xs text-slate-500">Created {createdDate}</p>
        <button 
          onClick={() => router.push(`/projects/${project.id}`)}
          className="flex items-center gap-1 text-sm font-medium text-cyan-300 hover:text-cyan-200 transition-colors"
        >
          Open <ChevronRight className="size-4" />
        </button>
      </div>
    </motion.article>
  );
}
