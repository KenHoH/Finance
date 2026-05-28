"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { TopNavbar } from "./TopNavbar";
import { PageTransition } from "./PageTransition";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-background">
        <PageTransition>{children}</PageTransition>
      </main>
    );
  }

  return (
    <>
      <Navbar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="lg:pl-[300px] min-h-screen flex flex-col p-4 sm:p-6 lg:p-8">
        <TopNavbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 flex flex-col pt-2">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </>
  );
}
