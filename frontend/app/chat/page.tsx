"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const agents = [{ id: "research", label: "Research Agent" }] as const;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [agent, setAgent] = useState<(typeof agents)[number]["id"]>("research");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage() {
    const message = input.trim();
    if (!message || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: message,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, message }),
      });
      const payload: unknown = await response.json();
      const responseText =
        typeof payload === "object" &&
        payload !== null &&
        "response" in payload &&
        typeof payload.response === "string"
          ? payload.response
          : undefined;

      if (!response.ok || !responseText) {
        const error =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Unable to get a response. Please try again.";
        throw new Error(error);
      }

      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", text: responseText },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "Unable to get a response. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#050914] text-slate-100">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-lg font-semibold">FounderGPT X</h1>
          <p className="text-sm text-slate-400">Your AI co-founder</p>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6">
        <div className="flex-1 space-y-5">
          {messages.length === 0 && (
            <div className="pt-24 text-center">
              <h2 className="text-2xl font-semibold">How can I help you build?</h2>
              <p className="mt-2 text-slate-400">Ask FounderGPT X about your next move.</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              key={message.id}
            >
              <p
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "bg-cyan-500 text-slate-950"
                    : "bg-white/10 text-slate-100"
                }`}
              >
                {message.text}
              </p>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-slate-300">
                Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form className="sticky bottom-0 mt-6 bg-[#050914] pb-2" onSubmit={handleSubmit}>
          <div className="flex items-end gap-3 rounded-2xl border border-white/15 bg-white/5 p-3 shadow-lg">
            <label className="sr-only" htmlFor="agent">
              AI agent
            </label>
            <select
              className="h-11 shrink-0 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
              disabled={isLoading}
              id="agent"
              onChange={(event) => setAgent(event.target.value as (typeof agents)[number]["id"])}
              value={agent}
            >
              {agents.map((availableAgent) => (
                <option key={availableAgent.id} value={availableAgent.id}>
                  {availableAgent.label}
                </option>
              ))}
            </select>
            <textarea
              aria-label="Message FounderGPT X"
              className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-500"
              disabled={isLoading}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message FounderGPT X..."
              rows={1}
              value={input}
            />
            <button
              className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!input.trim() || isLoading}
              type="submit"
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">Press Enter to send · Shift + Enter for a new line</p>
        </form>
      </section>
    </main>
  );
}
