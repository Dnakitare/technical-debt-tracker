import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { QueryProvider } from "@/components/providers/query-provider"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "DebtLens - Technical Debt Tracker",
    template: "%s | DebtLens",
  },
  description:
    "Track, estimate, and reduce your technical debt cost. Connect GitHub repos for instant visibility into debt trends, cost estimates, and team progress.",
  keywords: [
    "technical debt",
    "code quality",
    "engineering metrics",
    "GitHub integration",
    "debt tracker",
    "software maintenance",
  ],
  authors: [{ name: "DebtLens" }],
  creator: "DebtLens",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"
  ),
  openGraph: {
    type: "website",
    siteName: "DebtLens",
    title: "DebtLens - Technical Debt Tracker",
    description:
      "Track, estimate, and reduce your technical debt cost. Connect GitHub repos for instant visibility into debt trends, cost estimates, and team progress.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DebtLens - Technical Debt Tracker",
    description:
      "Track, estimate, and reduce your technical debt cost. Connect GitHub repos for instant visibility.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
