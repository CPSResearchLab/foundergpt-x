"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Check, Sparkles } from "lucide-react";
import { ChatMessage } from "@/services/chat";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function ChatMessageList({ messages, isLoading }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const copyToClipboard = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300/[.08] to-violet-400/[.08] text-cyan-200 mb-6">
          <Sparkles className="size-8" />
        </div>
        <h2 className="text-2xl font-medium tracking-tight text-white">How can I help you build?</h2>
        <p className="mt-2 text-slate-400 max-w-sm text-sm">
          I have full context on your project. Ask me to draft a business plan, research competitors, or brainstorm ideas.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      {messages.map((message) => {
        const isUser = message.role === "user";
        
        return (
          <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`group relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-5 ${isUser ? "bg-white/[.08] text-white rounded-br-sm" : "glass rounded-bl-sm border border-white/[.04]"}`}>
              {!isUser && (
                <div className="absolute -left-2 -top-2 grid size-6 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-violet-400 text-slate-950 p-1">
                  <Sparkles className="size-full" />
                </div>
              )}
              
              <div className={`prose prose-sm sm:prose-base max-w-none ${isUser ? "prose-invert" : "prose-invert prose-p:leading-relaxed prose-pre:bg-[#080d1b] prose-pre:border prose-pre:border-white/[.08]"}`}>
                {isUser ? (
                  <p className="m-0 whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                )}
              </div>

              {!isUser && (
                <button 
                  onClick={() => copyToClipboard(message.id, message.content)}
                  className="absolute -right-2 -bottom-2 p-1.5 rounded-lg bg-[#080d1b] border border-white/[.08] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                  title="Copy response"
                >
                  {copiedId === message.id ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                </button>
              )}
            </div>
          </div>
        );
      })}
      
      {isLoading && (
        <div className="flex justify-start">
          <div className="glass rounded-2xl rounded-bl-sm border border-white/[.04] p-5">
            <div className="flex items-center gap-1.5 h-6">
              <span className="size-2 rounded-full bg-cyan-300/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="size-2 rounded-full bg-cyan-300/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="size-2 rounded-full bg-cyan-300/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
}
