"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { PageTransition } from "./PageTransition";
export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-background">
        <PageTransition>{children}</PageTransition>
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="lg:pl-[300px] pt-24 lg:pt-4 lg:pr-4 min-h-screen">
        <PageTransition>{children}</PageTransition>
      </main>
    </>
  );
}
