"use client";

import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { setCsrfToken, fetchCsrfToken, extractApiError } from "@/lib/api";
import { ToastContainer } from "@/components/common/ToastContainer";
import { LoadingState } from "@/components/ui/LoadingState";
import { KeyboardShortcuts } from "@/components/common/KeyboardShortcuts";
import { A11yAnnouncer } from "@/components/common/A11yAnnouncer";
import { ServiceWorkerRegister } from "@/components/common/ServiceWorkerRegister";
import { ActivityLogProvider } from "@/components/common/ActivityLogInterceptor";

function AuthLoader({ children }: { children: React.ReactNode }){
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const csrf = params.get("csrf");
    if(token){
      const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${secureFlag}`;
      if(csrf){
        document.cookie = `csrf-token=${csrf}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${secureFlag}`;
        setCsrfToken(csrf);
      }
      params.delete("token");
      params.delete("csrf");
      const newUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
      window.location.replace(newUrl);
      return;
    }
    (async() => {
      await fetchCsrfToken();
      await fetchUser();
    })();
  }, [fetchUser]);

  if(isLoading){
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState message="Loading your account..." />
      </div>
    );
  }

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => {
      const toastStore = useToastStore.getState();
      return new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            // Only show toast if the query has no local error handler
            if(!query?.meta?.suppressGlobalError){
              toastStore.addToast(extractApiError(error, "Failed to load data. Please try again."), "error");
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      });
    }
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthLoader>
        <ActivityLogProvider>
          {children}
          <ToastContainer />
          <KeyboardShortcuts />
          <A11yAnnouncer />
          <ServiceWorkerRegister />
        </ActivityLogProvider>
      </AuthLoader>
    </QueryClientProvider>
  );
}
