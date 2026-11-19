import React from "react";
import i18n from "@/lib/i18n";
import { PremiumButton } from "@/shared/components/PremiumButton";

type AppErrorBoundaryProps = {
  children: React.ReactNode;
  resetKey?: string;
  compact?: boolean;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("Application rendering failed", error, info.componentStack);
    }
  }

  componentDidUpdate(previousProps: AppErrorBoundaryProps) {
    if (
      this.state.hasError &&
      previousProps.resetKey !== this.props.resetKey
    ) {
      this.setState({ hasError: false });
    }
  }

  private retry = () => {
    this.setState({ hasError: false });
  };

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main
        role="alert"
        className={this.props.compact
          ? "min-h-[50vh] flex items-center justify-center px-6 py-16"
          : "min-h-screen flex items-center justify-center px-6"}
      >
        <div className="max-w-md w-full text-center space-y-5">
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <span aria-hidden="true" className="text-destructive text-xl">!</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-medium">
            {i18n.t("common.unexpectedErrorTitle")}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {i18n.t("common.unexpectedErrorDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PremiumButton onClick={this.retry}>
              {i18n.t("common.retry")}
            </PremiumButton>
            <PremiumButton variant="outline" onClick={this.reload}>
              {i18n.t("common.reloadPage")}
            </PremiumButton>
          </div>
        </div>
      </main>
    );
  }
}
