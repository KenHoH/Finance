import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MainWrapper } from "@/components/common/MainWrapper";
import Providers from "./providers";
import { InteractiveGlow } from "@/components/ui/InteractiveGlow";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinPro - Finance Dashboard",
  description: "Track your income and investments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground relative min-h-screen dot-matrix`}
      >
        <InteractiveGlow />
        
        {/* Ambient Background Glows with Orbit Animation */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[var(--bg-gradient-1)] opacity-40 blur-[120px] mix-blend-normal animate-orbit" style={{ animationDuration: '25s' }} />
          <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-[var(--bg-gradient-2)] opacity-30 blur-[120px] mix-blend-normal animate-orbit" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
          <div className="absolute -bottom-[30%] left-[20%] w-[80%] h-[80%] rounded-full bg-[var(--bg-gradient-3)] opacity-30 blur-[150px] mix-blend-normal animate-orbit" style={{ animationDuration: '35s' }} />
        </div>

        <Providers>
          <MainWrapper>
            {children}
          </MainWrapper>
        </Providers>
      </body>
    </html>
  );
}
