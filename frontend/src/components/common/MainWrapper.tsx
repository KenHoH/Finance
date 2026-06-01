"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { PageTransition } from "./PageTransition";
import { AmbientBackground } from "./AmbientBackground";
import { QuickAddButton } from "./QuickAddButton";
import { ChatWidget } from "../chat/ChatWidget";
import { useSidebarStore } from "@/store/useSidebarStore";
import { cn } from "@/lib/utils";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const isAuthPage = pathname === '/' || pathname === '/login' || pathname === '/register';

  if(isAuthPage){
    return (
      <main className="min-h-screen bg-background">
        <PageTransition>{children}</PageTransition>
      </main>
    );
  }

  return (
    <>
      <AmbientBackground />
      <Sidebar />
      <TopBar />
      <QuickAddButton />
      <ChatWidget />
      <main className={cn("min-h-screen p-6 pt-20 sm:p-8 sm:pt-20 pb-24 transition-all duration-300", collapsed ? "lg:ml-[4.5rem]" : "lg:ml-[16rem]")}>
        <PageTransition>{children}</PageTransition>
      </main>
    </>
  );
}
