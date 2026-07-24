import { BaseAgent } from "./base";
import { PRODUCT_AGENT_PROMPT } from "./prompts";
import type { AgentCapability } from "./types";

export class ProductAgent extends BaseAgent {
  readonly name = "product";
  readonly displayLabel = "Product";
  readonly description = "Product strategy, roadmap, MVP scoping, and product-market fit.";
  readonly icon = "🧩";
  readonly capabilities: readonly AgentCapability[] = [
    { id: "roadmap", name: "Product Roadmap", description: "Build and prioritise the product roadmap." },
    { id: "mvp", name: "MVP Scoping", description: "Define the smallest valuable product." },
    { id: "user-stories", name: "User Stories", description: "Write clear user stories and acceptance criteria." },
    { id: "pmf", name: "Product-Market Fit", description: "Identify and measure PMF signals." },
    { id: "prioritisation", name: "Feature Prioritisation", description: "Prioritise features using evidence." },
    { id: "metrics", name: "Product Metrics", description: "Define and track the right product metrics." },
  ];
  protected readonly promptDefinition = PRODUCT_AGENT_PROMPT;
}
