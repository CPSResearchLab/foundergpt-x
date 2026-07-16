import type { Metadata } from "next";

import { AmplifyProvider } from "@/components/auth/amplify-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FounderGPT X | Build with clarity",
    template: "%s | FounderGPT X",
  },
  description: "The AI operating system for ambitious founders.",
  applicationName: "FounderGPT X",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "FounderGPT X",
    title: "FounderGPT X | Build with clarity",
    description: "The AI operating system for ambitious founders.",
  },
  twitter: {
    card: "summary",
    title: "FounderGPT X | Build with clarity",
    description: "The AI operating system for ambitious founders.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#050914]">
        <AmplifyProvider>{children}</AmplifyProvider>
      </body>
    </html>
  );
}
