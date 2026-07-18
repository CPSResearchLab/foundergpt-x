export interface Project {
  id: string;
  name: string;
  description: string;
  industry: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "foundergpt_projects";

// Helper to delay slightly to simulate network request
const simulateNetwork = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

export async function getProjects(): Promise<Project[]> {
  await simulateNetwork();
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export async function getProject(id: string): Promise<Project | null> {
  await simulateNetwork();
  const projects = await getProjects();
  return projects.find(p => p.id === id) || null;
}

export async function createProject(data: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<Project> {
  await simulateNetwork();
  const projects = await getProjects();
  const now = new Date().toISOString();
  
  const newProject: Project = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  
  projects.push(newProject);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }
  return newProject;
}

export async function updateProject(id: string, data: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>): Promise<Project | null> {
  await simulateNetwork();
  const projects = await getProjects();
  const index = projects.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  const updatedProject = {
    ...projects[index],
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  projects[index] = updatedProject;
  
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }
  
  return updatedProject;
}

export async function deleteProject(id: string): Promise<boolean> {
  await simulateNetwork();
  const projects = await getProjects();
  const filtered = projects.filter(p => p.id !== id);
  
  if (filtered.length === projects.length) return false;
  
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
  return true;
}
