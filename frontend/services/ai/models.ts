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
} as const;