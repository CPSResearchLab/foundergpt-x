import { documentManager } from "../documents/document-manager";
import { memoryManager } from "../memory/memory-manager";
import type { ToolCallContext, ToolDefinition, ToolResult } from "./orchestration-types";

export class AgentToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  constructor() {
    this.register({ name: "calculator", description: "Evaluate basic arithmetic expressions.", execute: async (input) => calculate(input) });
    this.register({ name: "memory.search", description: "Search shared FounderGPT memories.", execute: async (input, context) => {
      const results = await memoryManager.search(input, { projectId: context.projectId, limit: 8 });
      return { success: true, output: JSON.stringify(results.map((result) => ({ title: result.memory.title, summary: result.memory.summary, score: result.score }))) };
    } });
    this.register({ name: "documents.search", description: "Search indexed project documents and chunks.", execute: async (input, context) => {
      const results = await documentManager.search({ query: input, projectId: context.projectId, limit: 8 });
      return { success: true, output: JSON.stringify(results.map((result) => ({ title: result.document.title, text: result.chunk.text, score: result.score, reason: result.reasonMatched }))) };
    } });
    this.register({ name: "project.search", description: "Search project-scoped memories and project facts.", execute: async (input, context) => {
      const results = await memoryManager.search(input, { projectId: context.projectId, limit: 12 });
      return { success: true, output: JSON.stringify(results.map((result) => ({ type: result.memory.type, title: result.memory.title, summary: result.memory.summary }))) };
    } });
    this.register({ name: "web.search", description: "Future web search integration boundary.", execute: async () => ({ success: false, output: "", error: "Web search is not configured." }) });
  }

  register(tool: ToolDefinition): this { this.tools.set(tool.name, tool); return this; }
  get(name: string): ToolDefinition | undefined { return this.tools.get(name); }
  list(): ToolDefinition[] { return [...this.tools.values()]; }
  async execute(name: string, input: string, context: ToolCallContext): Promise<ToolResult> {
    const tool = this.get(name);
    if (!tool) return { success: false, output: "", error: `Unknown tool: ${name}.` };
    try { return await tool.execute(input, context); } catch (error: unknown) { return { success: false, output: "", error: error instanceof Error ? error.message : "Tool execution failed." }; }
  }
}

function calculate(input: string): Promise<ToolResult> {
  try {
    const parser = new ArithmeticParser(input);
    const value = parser.parse();
    if (!Number.isFinite(value)) return Promise.resolve({ success: false, output: "", error: "Expression did not produce a finite number." });
    return Promise.resolve({ success: true, output: String(value) });
  } catch (error: unknown) { return Promise.resolve({ success: false, output: "", error: error instanceof Error ? error.message : "Invalid arithmetic expression." }); }
}

class ArithmeticParser {
  private index = 0;
  private readonly source: string;
  constructor(source: string) { this.source = source.replace(/\s+/g, ""); }
  parse(): number { const value = this.expression(); if (this.index !== this.source.length) throw new Error("Unexpected token."); return value; }
  private expression(): number { let value = this.term(); while (this.peek() === "+" || this.peek() === "-") { const operator = this.source[this.index++]; const right = this.term(); value = operator === "+" ? value + right : value - right; } return value; }
  private term(): number { let value = this.factor(); while (this.peek() === "*" || this.peek() === "/") { const operator = this.source[this.index++]; const right = this.factor(); if (operator === "/" && right === 0) throw new Error("Division by zero."); value = operator === "*" ? value * right : value / right; } return value; }
  private factor(): number { if (this.peek() === "-") { this.index++; return -this.factor(); } if (this.peek() === "(") { this.index++; const value = this.expression(); if (this.source[this.index++] !== ")") throw new Error("Missing closing parenthesis."); return value; } const start = this.index; while (/[0-9.]/u.test(this.peek() ?? "")) this.index++; const value = Number(this.source.slice(start, this.index)); if (start === this.index || !Number.isFinite(value)) throw new Error("Expected a number."); return value; }
  private peek(): string | undefined { return this.source[this.index]; }
}
