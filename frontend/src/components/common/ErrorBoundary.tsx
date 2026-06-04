"use client";

import React, { Component, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * React Error Boundary with retry action.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if(this.state.hasError) {
      if(this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-primary/5 blur-3xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card shadow-lg">
              <AlertTriangle className="h-10 w-10 text-amber-400" />
            </div>
          </div>

          <h1 className="mt-8 text-2xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="mt-3 max-w-sm text-base text-muted-foreground leading-relaxed">
            An unexpected error occurred. Try again or return home.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <button
              onClick={this.handleRetry}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-[0.98]",
                "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
            <Link
              href="/"
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-[0.98]",
                "bg-card border border-border text-foreground hover:bg-card/80"
              )}
            >
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
