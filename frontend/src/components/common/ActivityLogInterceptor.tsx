"use client";

import React, { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { post } from "@/lib/api";

interface LogEntry {
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
}

function useActivityLog(){
  return useMutation({
    mutationFn: (entry: LogEntry) => post("/activity-logs", entry),
  });
}

/**
 * Global activity log interceptor.
 * Hooks into mutation events to auto-log CRUD actions.
 */
export function ActivityLogProvider({ children }: { children: React.ReactNode }){
  const log = useActivityLog();

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async(input: RequestInfo | URL, init?: RequestInit) => {
      const response = await originalFetch(input, init);
      try{
        const url = typeof input === "string" ? input : input.toString();
        const method = init?.method || "GET";
        const isInternal = url.includes("__nextjs") || url.includes("/_next") || url.startsWith("http") && !url.includes(window.location.host);
        if(method !== "GET" && !url.includes("/activity-logs") && !isInternal) {
          const action = method === "POST" ? "CREATE" : method === "PUT" || method === "PATCH" ? "UPDATE" : method === "DELETE" ? "DELETE" : "OTHER";
          const entity = url.split("/").filter(Boolean).pop() || "unknown";
          log.mutate({ action, entity, details: `${method} ${url}` });
        }
      } catch{ /* ignore */ }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [log]);

  return <>{children}</>;
}
