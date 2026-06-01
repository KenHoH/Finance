"use client";

import React, { useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(){
  const ctx = useContext(TabsContext);
  if(!ctx) throw new Error("Tabs compound components must be inside <Tabs>");
  return ctx;
}

interface TabsProps {
  defaultTab: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable tabs component with active indicator.
 */
export function Tabs({ defaultTab, children, className }: TabsProps){
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ children, className }: { children: React.ReactNode; className?: string }){
  return (
    <div className={cn("flex gap-1 rounded-xl bg-accent/50 p-1", className)}>
      {children}
    </div>
  );
}

export function Tab({ id, children }: { id: string; children: React.ReactNode }){
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === id;
  return (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
        isActive
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
      aria-selected={isActive}
      role="tab"
    >
      {children}
    </button>
  );
}

export function TabPanel({ id, children }: { id: string; children: React.ReactNode }){
  const { activeTab } = useTabs();
  if(activeTab !== id) return null;
  return <div role="tabpanel">{children}</div>;
}
