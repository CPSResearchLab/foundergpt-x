"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { DashboardAuthGate } from "@/components/auth/dashboard-auth-gate";

interface AgentDescriptor {
  id: string;
  label: string;
  description: string;
  icon: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export default function ChatPage() {
  const [agents, setAgents] = useState<AgentDescriptor[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [agentId, setAgentId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load agent list from the server on mount
  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (
          typeof data === "object" &&
          data !== null &&
          "agents" in data &&
          Array.isArray((data as { agents: unknown }).agents)
        ) {
          const list = (data as { agents: AgentDescriptor[] }).agents;
          setAgents(list);
          if (list.length > 0 && !agentId) setAgentId(list[0].id);
        }
      })
      .catch(() => {/* silently ignore — UI degrades gracefully */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const selectedAgent = agents.find((a) => a.id === agentId);

  async function sendMessage() {
    const message = input.trim();
    if (!message || isLoading || !agentId) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", text: message };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: agentId, message }),
      });
      const payload: unknown = await response.json();
      const responseText =
        typeof payload === "object" &&
        payload !== null &&
        "response" in payload &&
        typeof (payload as { response: unknown }).response === "string"
          ? (payload as { response: string }).response
          : undefined;

      if (!response.ok || !responseText) {
        const error =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as { error: unknown }).error === "string"
            ? (payload as { error: string }).error
            : "Unable to get a response. Please try again.";
        throw new Error(error);
      }

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", text: responseText }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: error instanceof Error ? error.message : "Unable to get a response. Please try again.",
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
    <DashboardAuthGate>
      <main className="flex min-h-screen flex-col bg-[#050914] text-slate-100">
        <header className="border-b border-white/10 px-6 py-4">
          <div className="mx-auto max-w-3xl flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">FounderGPT X</h1>
              <p className="text-sm text-slate-400">Your AI co-founder team</p>
            </div>
            {selectedAgent && (
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
                <span className="text-lg">{selectedAgent.icon}</span>
                <div>
                  <p className="text-sm font-medium leading-none">{selectedAgent.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-[200px] truncate">{selectedAgent.description}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6">
          <div className="flex-1 space-y-5">
            {messages.length === 0 && (
              <div className="pt-16 text-center">
                <h2 className="text-2xl font-semibold">How can I help you build?</h2>
                <p className="mt-2 text-slate-400">
                  {selectedAgent
                    ? `${selectedAgent.icon} ${selectedAgent.label} is ready — ask anything.`
                    : "Select an agent below to get started."}
                </p>
                {agents.length > 0 && (
                  <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {agents.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAgentId(a.id)}
                        className={`rounded-xl border px-3 py-2.5 text-left transition ${
                          a.id === agentId
                            ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                            : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-xl">{a.icon}</span>
                        <p className="mt-1 text-sm font-medium">{a.label}</p>
                        <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{a.description}</p>
                      </button>
                    ))}
                  </div>
                )}
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
                  {selectedAgent ? `${selectedAgent.icon} Thinking…` : "Thinking…"}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form className="sticky bottom-0 mt-6 bg-[#050914] pb-2" onSubmit={handleSubmit}>
            <div className="flex items-end gap-3 rounded-2xl border border-white/15 bg-white/5 p-3 shadow-lg">
              <label className="sr-only" htmlFor="agent">AI agent</label>
              <select
                className="h-11 shrink-0 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                disabled={isLoading || agents.length === 0}
                id="agent"
                onChange={(e) => setAgentId(e.target.value)}
                value={agentId}
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.label}
                  </option>
                ))}
              </select>
              <textarea
                aria-label="Message FounderGPT X"
                className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-500"
                disabled={isLoading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedAgent ? `Ask the ${selectedAgent.label} agent…` : "Message FounderGPT X..."}
                rows={1}
                value={input}
              />
              <button
                className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!input.trim() || isLoading || !agentId}
                type="submit"
              >
                Send
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">
              Press Enter to send · Shift + Enter for new line
            </p>
          </form>
        </section>
      </main>
    </DashboardAuthGate>
  );
}
