// src/app/layout.tsx 
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "./providers/NextAuthSessionProvider"; 
import ThemeProvider from "@/app/providers/ThemeProvider";
import ReactQueryProvider from "@/app/providers/ReactQueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Prevent FOIT (Flash of Invisible Text)
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true, // Reduce CLS
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['Courier New', 'monospace'],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: {
    default: "System Design Platform - Learn & Practice",
    template: "%s | System Design Platform"
  },
  description: "Master system design through interactive diagrams, real-world problems, and AI-powered feedback. Practice designing scalable systems with our comprehensive component library.",
  keywords: ["system design", "software architecture", "distributed systems", "scalability", "system design interview", "technical interview"],
  authors: [{ name: "System Design Platform" }],
  creator: "System Design Platform",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "System Design Platform - Learn & Practice",
    description: "Master system design through interactive diagrams and real-world problems",
    siteName: "System Design Platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "System Design Platform",
    description: "Master system design through interactive diagrams",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here
    // google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthSessionProvider>
          <ReactQueryProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </ReactQueryProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}