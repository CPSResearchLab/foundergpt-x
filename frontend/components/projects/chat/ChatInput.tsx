"use client";

import { useState, useRef, useEffect } from "react";
import { Send, CornerDownLeft } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-[#050914] border-t border-white/[.04]">
      <div className="relative max-w-4xl mx-auto flex items-end gap-2 rounded-2xl border border-white/[.08] bg-white/[.02] p-2 focus-within:border-cyan-300/40 focus-within:ring-1 focus-within:ring-cyan-300/20 transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message FounderGPT..."
          disabled={isLoading}
          className="max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-50"
          rows={1}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="flex shrink-0 h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950 hover:bg-cyan-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
          title="Send message"
        >
          <Send className="size-4" />
        </button>
      </div>
      <div className="mt-2 text-center">
        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
          Press <span className="flex items-center justify-center rounded bg-white/10 px-1 py-0.5"><CornerDownLeft className="size-2.5" /></span> to send, Shift + Return for new line. AI can make mistakes.
        </p>
      </div>
    </div>
  );
}
