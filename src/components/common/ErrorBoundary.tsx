"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-sm text-muted-foreground p-6">
          <span className="icon-[solar--danger-triangle-bold-duotone] text-destructive size-8" />
          <p className="font-medium">Something went wrong</p>
          <p className="text-xs text-muted-foreground max-w-md text-center">
            {this.state.error?.message || "An unexpected error occurred. Try refreshing the page."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-sm text-primary underline underline-offset-2 hover:no-underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
