"use client";

import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

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
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400" />
          <h3 className="text-sm font-semibold text-foreground">Something went wrong</h3>
          <p className="max-w-xs text-xs text-muted-foreground">
            An unexpected error occurred. Please try again or refresh the page.
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-3 w-3" />
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
