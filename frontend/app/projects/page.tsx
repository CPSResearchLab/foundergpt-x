"use client";

import { useState, useEffect, useMemo } from "react";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { EmptyState } from "@/components/projects/EmptyState";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { Project, getProjects, createProject, updateProject, deleteProject } from "@/services/projects";
import { DashboardAuthGate } from "@/components/auth/dashboard-auth-gate";
import { Menu, Bell, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    async function loadProjects() {
      const data = await getProjects();
      setProjects(data);
      setIsLoading(false);
    }
    loadProjects();
  }, []);

  const handleCreateProject = async (data: { name: string; description?: string; industry?: string }) => {
    const newProject = await createProject({
      name: data.name,
      description: data.description || "",
      industry: data.industry || "",
    });
    setProjects(prev => [...prev, newProject]);
    setIsModalOpen(false);
  };

  const handleUpdateProject = async (data: { name: string; description?: string; industry?: string }) => {
    if (!editingProject) return;
    const updated = await updateProject(editingProject.id, {
      name: data.name,
      description: data.description || "",
      industry: data.industry || "",
    });
    if (updated) {
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleDeleteProject = async (project: Project) => {
    if (window.confirm(`Are you sure you want to delete ${project.name}?`)) {
      await deleteProject(project.id);
      setProjects(prev => prev.filter(p => p.id !== project.id));
    }
  };

  const openNewProjectModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const openEditProjectModal = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.industry.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  return (
    <DashboardAuthGate>
      <main className="min-h-screen bg-[#050914] text-white">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,.05),transparent_26%),radial-gradient(circle_at_20%_100%,rgba(139,92,246,.05),transparent_25%)]" />
        
        {/* We use standard layout wrapper, assuming layout.tsx provides Sidebar. If not, this matches dashboard. */}
        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[.07] bg-[#050914]/80 px-5 backdrop-blur-xl sm:px-8 lg:hidden">
            <div className="flex items-center gap-3">
              <button className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-white/5 lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('#')} className="relative grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-white/5" aria-label="Notifications">
                <Bell className="size-4" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-cyan-300" />
              </button>
              <div className="size-8 rounded-full bg-gradient-to-br from-cyan-300 to-violet-400 p-px">
                <div className="grid size-full place-items-center rounded-full bg-slate-900 text-xs font-medium">AM</div>
              </div>
            </div>
          </header>

          <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
            <ProjectHeader 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onNewProject={openNewProjectModal}
            />

            <div className="mt-8">
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
                </div>
              ) : filteredProjects.length > 0 ? (
                <ProjectGrid 
                  projects={filteredProjects}
                  onRename={openEditProjectModal}
                  onDelete={handleDeleteProject}
                />
              ) : (
                <EmptyState 
                  isSearch={searchQuery.length > 0} 
                  onNewProject={openNewProjectModal} 
                />
              )}
            </div>
          </section>
        </div>

        <ProjectModal 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProject(null);
          }}
          onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
          initialData={editingProject}
        />
      </main>
    </DashboardAuthGate>
  );
}