"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>
    </>
  );
}
