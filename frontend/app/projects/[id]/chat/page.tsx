"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Menu } from "lucide-react";
import { DashboardAuthGate } from "@/components/auth/dashboard-auth-gate";
import { ChatLayout } from "@/components/projects/chat/ChatLayout";
import { ChatSidebar } from "@/components/projects/chat/ChatSidebar";
import { ChatMessageList } from "@/components/projects/chat/ChatMessageList";
import { ChatInput } from "@/components/projects/chat/ChatInput";
import { Project, getProject } from "@/services/projects";
import { ChatSession, ChatMessage, getProjectChats, getChatMessages, createChatSession, addMessageToChat, deleteChatSession, sendChatMessage } from "@/services/chat";

export default function ProjectChatPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWaitingForAi, setIsWaitingForAi] = useState(false);

  useEffect(() => {
    async function init() {
      if (!id) return;
      const proj = await getProject(id);
      if (!proj) {
        setIsInitializing(false);
        return;
      }
      setProject(proj);

      const projectSessions = await getProjectChats(id);
      setSessions(projectSessions);

      if (projectSessions.length > 0) {
        const firstSession = projectSessions[0];
        setActiveSessionId(firstSession.id);
        const msgs = await getChatMessages(firstSession.id);
        setMessages(msgs);
      } else {
        const newSession = await createChatSession(id, "New Chat");
        setSessions([newSession]);
        setActiveSessionId(newSession.id);
        setMessages([]);
      }
      setIsInitializing(false);
    }
    init();
  }, [id]);

  const loadSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setMessages([]);
    setIsSidebarOpen(false);
    const msgs = await getChatMessages(sessionId);
    setMessages(msgs);
  };

  const handleNewChat = async () => {
    if (!id) return;
    const newSession = await createChatSession(id, "New Chat");
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteChatSession(sessionId);
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    
    if (activeSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        loadSession(updatedSessions[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeSessionId || !project) return;

    // Add user message to UI immediately
    const userMsg = await addMessageToChat(activeSessionId, "user", content);
    setMessages(prev => [...prev, userMsg]);
    setIsWaitingForAi(true);

    // Update title of new chat if it's the first message
    if (messages.length === 0) {
      const title = content.length > 30 ? content.substring(0, 30) + "..." : content;
      // Note: we don't have updateChatSessionTitle yet, but we'll reflect in UI
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title } : s));
    }

    try {
      const contextMetadata = `Project Name: ${project.name}, Industry: ${project.industry}, Description: ${project.description || "None"}`;
      const aiResponse = await sendChatMessage(content, contextMetadata, "research");
      
      const assistantMsg = await addMessageToChat(activeSessionId, "assistant", aiResponse);
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg = await addMessageToChat(activeSessionId, "assistant", "Sorry, I encountered an error processing your request.");
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsWaitingForAi(false);
    }
  };

  if (isInitializing) {
    return (
      <DashboardAuthGate>
        <main className="min-h-screen bg-[#050914] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
        </main>
      </DashboardAuthGate>
    );
  }

  if (!project) {
    return (
      <DashboardAuthGate>
        <main className="min-h-screen bg-[#050914] text-white flex flex-col items-center justify-center">
          <h1 className="text-2xl font-medium">Project not found</h1>
          <button 
            onClick={() => router.push("/projects")}
            className="mt-6 flex items-center gap-2 text-cyan-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" /> Back to Projects
          </button>
        </main>
      </DashboardAuthGate>
    );
  }

  const sidebarNode = (
    <div className="h-full flex flex-col">
      <div className="h-16 flex items-center px-4 border-b border-white/[.07] shrink-0">
        <button 
          onClick={() => router.push(`/projects/${id}`)}
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to {project.name}
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatSidebar 
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={loadSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
        />
      </div>
    </div>
  );

  const mainNode = (
    <>
      <header className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-white/[.07] bg-[#050914]/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden text-slate-400 hover:text-white p-1"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div>
            <h2 className="text-sm font-medium text-white">AI Workspace</h2>
            <p className="text-xs text-slate-500">Context: {project.name}</p>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-[#050914] shadow-2xl">
            {sidebarNode}
          </div>
        </div>
      )}

      <ChatMessageList messages={messages} isLoading={isWaitingForAi} />
      <ChatInput onSend={handleSendMessage} isLoading={isWaitingForAi} />
    </>
  );

  return (
    <DashboardAuthGate>
      <ChatLayout sidebar={sidebarNode} main={mainNode} />
    </DashboardAuthGate>
  );
}
