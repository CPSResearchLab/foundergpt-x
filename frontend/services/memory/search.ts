import { searchFounderMemory } from "./founder";
import { searchCompanyMemory } from "./company";
import { searchTaskMemory } from "./tasks";
import { searchResearchMemory } from "./research";
import { searchDecisionMemory } from "./decisions";
import { searchDocumentMemory } from "./documents";
import { searchProjectMemory } from "./projects";
import type {
  FounderMemory,
  CompanyMemory,
  TaskMemory,
  ResearchMemory,
  DecisionMemory,
  DocumentMemory,
  ProjectMemory,
} from "./types";

export interface UnifiedSearchResults {
  founders: FounderMemory[];
  companies: CompanyMemory[];
  tasks: TaskMemory[];
  research: ResearchMemory[];
  decisions: DecisionMemory[];
  documents: DocumentMemory[];
  projects: ProjectMemory[];
}

export interface SearchOptions {
  query: string;
  projectId?: string;
}

/** Search across all memory collections in parallel. */
export async function searchAllMemory(options: SearchOptions): Promise<UnifiedSearchResults> {
  const { query, projectId } = options;

  const [founders, companies, tasks, research, decisions, documents, projects] = await Promise.all([
    searchFounderMemory(query, projectId),
    searchCompanyMemory(query, projectId),
    searchTaskMemory(query, projectId),
    searchResearchMemory(query, projectId),
    searchDecisionMemory(query, projectId),
    searchDocumentMemory(query, projectId),
    searchProjectMemory(query),
  ]);

  return { founders, companies, tasks, research, decisions, documents, projects };
}
