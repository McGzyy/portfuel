"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { PanelErrorState } from "@/components/errors/PanelErrorState";

type Props = {
  children: ReactNode;
  title?: string;
  message?: string;
};

type State = {
  error: Error | null;
};

/** Catches client render errors inside a workspace panel without breaking the shell. */
export class ClientErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ClientErrorBoundary]", error, info.componentStack);
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <PanelErrorState
          title={this.props.title ?? "This section crashed"}
          message={
            this.props.message ??
            "A client error stopped this panel from rendering. Try again or navigate away and back."
          }
          onRetry={this.retry}
        />
      );
    }
    return this.props.children;
  }
}
