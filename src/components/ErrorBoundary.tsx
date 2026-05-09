import React from "react";

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error): void {
    console.error("ErrorBoundary:", error);
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="m-6 rounded bg-red-50 p-4 text-sm">
          <p>Something went wrong. Your data is safe (stored locally). Try refreshing.</p>
          <button className="mt-2 rounded bg-red-600 px-3 py-1 text-white" onClick={() => this.setState({ hasError: false })}>
            Reset
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

