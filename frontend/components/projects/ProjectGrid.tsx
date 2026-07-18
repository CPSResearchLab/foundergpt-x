"use client";

import { Project } from "@/services/projects";
import { ProjectCard } from "./ProjectCard";

interface ProjectGridProps {
  projects: Project[];
  onRename: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectGrid({ projects, onRename, onDelete }: ProjectGridProps) {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          onRename={onRename} 
          onDelete={onDelete} 
        />
      ))}
    </div>
  );
}
