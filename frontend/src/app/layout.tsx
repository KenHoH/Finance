import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { MainWrapper } from "@/components/common/MainWrapper";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import Providers from "./providers";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "FinPro - Finance Dashboard",
  description: "Track your income, expenses, budgets, goals, investments, debts, and split bills all in one beautifully simple dashboard.",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", sizes: "any" },
    ],
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "FinPro - Finance Dashboard",
    description: "Track your income, expenses, budgets, goals, investments, debts, and split bills all in one beautifully simple dashboard.",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <Providers>
          <ErrorBoundary>
            <MainWrapper>
              {children}
            </MainWrapper>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
