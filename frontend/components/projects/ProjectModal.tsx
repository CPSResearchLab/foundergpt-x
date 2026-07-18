"use client";

import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X } from "lucide-react";
import { Project } from "@/services/projects";
import { useEffect } from "react";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional(),
  industry: z.string().max(100).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  initialData?: Project | null;
}

export function ProjectModal({ isOpen, onClose, onSubmit, initialData }: ProjectModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      industry: "",
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          description: initialData.description,
          industry: initialData.industry,
        });
      } else {
        reset({ name: "", description: "", industry: "" });
      }
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md rounded-2xl border border-white/[.08] bg-[#080d1b] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-white/[.04] p-5 sm:p-6">
          <h2 className="text-xl font-medium tracking-[-.02em] text-white">
            {initialData ? "Rename Project" : "New Project"}
          </h2>
          <button 
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-white/5 hover:text-slate-300"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-6 space-y-5">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-300">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              {...register("name")}
              placeholder="e.g. Acme Corp"
              className="w-full rounded-xl border border-white/[.08] bg-white/[.02] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none focus:ring-1 focus:ring-cyan-300/50"
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="industry" className="text-sm font-medium text-slate-300">
              Industry <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              id="industry"
              {...register("industry")}
              placeholder="e.g. Fintech, E-commerce"
              className="w-full rounded-xl border border-white/[.08] bg-white/[.02] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none focus:ring-1 focus:ring-cyan-300/50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-slate-300">
              Description <span className="text-slate-500">(Optional)</span>
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={3}
              placeholder="What are you building?"
              className="w-full resize-none rounded-xl border border-white/[.08] bg-white/[.02] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none focus:ring-1 focus:ring-cyan-300/50"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-white px-5 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-50 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : initialData ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
