export const MODELS = {
  gemini: {
    fast: "gemini-2.5-flash",
    smart: "gemini-2.5-pro",
  },
  groq: {
    fast: "llama-3.3-70b-versatile",
  },
  openrouter: {
    default: "openai/gpt-4.1-mini",
  },
  nvidia: {
    default: "meta/llama-3.1-70b-instruct",
  },
  bedrock: {
    default: "amazon.nova-lite-v1:0",
    smart: "amazon.nova-pro-v1:0",
  },
  claude: {
    default: "anthropic.claude-3-5-haiku-20241022-v1:0",
    smart: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  },
} as const;
