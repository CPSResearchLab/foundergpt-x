export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  projectId: string;
  title: string;
  updatedAt: string;
}

const SESSIONS_KEY = "foundergpt_chat_sessions";
const MESSAGES_KEY = "foundergpt_chat_messages";

const simulateNetwork = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms));

export async function getProjectChats(projectId: string): Promise<ChatSession[]> {
  await simulateNetwork();
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(SESSIONS_KEY);
  const sessions: ChatSession[] = data ? JSON.parse(data) : [];
  return sessions.filter(s => s.projectId === projectId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  await simulateNetwork();
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(MESSAGES_KEY);
  const messages: ChatMessage[] = data ? JSON.parse(data) : [];
  return messages.filter(m => m.sessionId === sessionId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function createChatSession(projectId: string, title: string = "New Chat"): Promise<ChatSession> {
  await simulateNetwork();
  const sessionsData = typeof window !== "undefined" ? localStorage.getItem(SESSIONS_KEY) : null;
  const sessions: ChatSession[] = sessionsData ? JSON.parse(sessionsData) : [];
  
  const newSession: ChatSession = {
    id: crypto.randomUUID(),
    projectId,
    title,
    updatedAt: new Date().toISOString(),
  };
  
  sessions.push(newSession);
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
  return newSession;
}

export async function addMessageToChat(sessionId: string, role: "user" | "assistant", content: string): Promise<ChatMessage> {
  await simulateNetwork();
  
  // Save message
  const messagesData = typeof window !== "undefined" ? localStorage.getItem(MESSAGES_KEY) : null;
  const messages: ChatMessage[] = messagesData ? JSON.parse(messagesData) : [];
  
  const newMessage: ChatMessage = {
    id: crypto.randomUUID(),
    sessionId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
  
  messages.push(newMessage);
  if (typeof window !== "undefined") {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }

  // Update session updatedAt
  const sessionsData = typeof window !== "undefined" ? localStorage.getItem(SESSIONS_KEY) : null;
  if (sessionsData) {
    const sessions: ChatSession[] = JSON.parse(sessionsData);
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].updatedAt = new Date().toISOString();
      if (typeof window !== "undefined") {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      }
    }
  }

  return newMessage;
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await simulateNetwork();
  if (typeof window === "undefined") return;

  const sessionsData = localStorage.getItem(SESSIONS_KEY);
  if (sessionsData) {
    const sessions: ChatSession[] = JSON.parse(sessionsData);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.filter(s => s.id !== sessionId)));
  }

  const messagesData = localStorage.getItem(MESSAGES_KEY);
  if (messagesData) {
    const messages: ChatMessage[] = JSON.parse(messagesData);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages.filter(m => m.sessionId !== sessionId)));
  }
}

// AI API Abstraction
export async function sendChatMessage(prompt: string, contextMetadata: string, agent: string = "research"): Promise<string> {
  // Prepend project context to the prompt transparently
  const fullPrompt = `[SYSTEM CONTEXT: ${contextMetadata}]\n\nUser Message: ${prompt}`;

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: fullPrompt, agent }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to communicate with AI.");
  }

  const data = await response.json();
  return data.response;
}
