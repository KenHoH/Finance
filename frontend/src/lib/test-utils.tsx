import React from "react";
import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function AllProviders({ children }: { children: React.ReactNode }){
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export function render(ui: React.ReactElement, options?: RenderOptions) {
  return rtlRender(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react";
