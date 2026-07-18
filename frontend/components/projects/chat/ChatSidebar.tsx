"use client";

import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { ChatSession } from "@/services/chat";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}

export function ChatSidebar({ sessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession }: ChatSidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r border-white/[.07] bg-[#050914] p-4">
      <button 
        onClick={onNewChat}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-slate-950 hover:bg-cyan-50 transition-colors mb-6"
      >
        <Plus className="size-4" /> New Chat
      </button>

      <div className="flex-1 overflow-y-auto space-y-1">
        <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">History</h3>
        {sessions.length === 0 ? (
          <p className="px-2 text-sm text-slate-600">No recent chats.</p>
        ) : (
          sessions.map(session => (
            <div 
              key={session.id}
              className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors cursor-pointer ${activeSessionId === session.id ? "bg-white/[.08] text-white" : "text-slate-400 hover:bg-white/[.04] hover:text-slate-200"}`}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare className="size-4 shrink-0" />
                <span className="truncate">{session.title}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all rounded-md hover:bg-white/5"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
