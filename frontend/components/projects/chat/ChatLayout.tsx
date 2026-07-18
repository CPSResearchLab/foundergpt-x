"use client";

import { ReactNode } from "react";

interface ChatLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

export function ChatLayout({ sidebar, main }: ChatLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-screen w-full overflow-hidden bg-[#050914]">
      <div className="hidden md:block shrink-0">
        {sidebar}
      </div>
      <div className="flex-1 flex flex-col relative w-full min-w-0">
        {/* Background gradient effect */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,.03),transparent_26%),radial-gradient(circle_at_20%_100%,rgba(139,92,246,.03),transparent_25%)]" />
        
        {main}
      </div>
    </div>
  );
}
