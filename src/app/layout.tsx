import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoVid Pro — AI Video Generation Studio",
  description: "Self-building AI video generation pipeline. Turn any topic into a fully-narrated video with 5 orchestrated AI nodes — script, scenes, images, voiceover, and assembly. Powered by free Z.ai models.",
  keywords: ["AI video", "video generation", "n8n", "workflow", "AI pipeline", "text to video", "AutoVid"],
  authors: [{ name: "AutoVid Pro" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "AutoVid Pro — AI Video Generation Studio",
    description: "Self-building AI video generation pipeline powered by free Z.ai models",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: 'rgba(20, 20, 25, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
            },
          }}
        />
      </body>
    </html>
  );
}
