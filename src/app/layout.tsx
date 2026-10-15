import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/config";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Runs before first paint: applies the saved/OS theme with no flash. */
const themeScript = `(function(){try{var t=localStorage.getItem('documind-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${APP_NAME} — Ask questions about your documents`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "DocuMind AI reads your PDFs, Word and text documents, then answers questions, writes summaries, extracts data and compares files — grounded in your documents, never guessed.",
  keywords: ["AI document assistant", "PDF Q&A", "document summarizer", "RAG", "document comparison"],
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — Ask questions about your documents`,
    description:
      "Upload documents, ask questions with cited answers, generate summaries, extract structured data, and compare files.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Ask questions about your documents`,
    description: "Your AI document assistant: Q&A, summaries, extraction and comparison.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#3e58dc",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
