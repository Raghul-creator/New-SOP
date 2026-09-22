import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReturnToDashboard?: () => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SOPCreatorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SOP Creator error caught by error boundary:', error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          id="sop-creator-error-boundary"
          className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-rose-100 shadow-sm text-center space-y-6"
        >
          <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">
              Unable to load SOP Creator
            </h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
              We encountered an unexpected issue while preparing the SOP authoring workspace. You can retry or return to the main dashboard.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              id="sop-error-retry-btn"
              onClick={this.handleRetry}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>

            <button
              type="button"
              id="sop-error-return-dashboard-btn"
              onClick={() => {
                if (this.props.onReturnToDashboard) {
                  this.props.onReturnToDashboard();
                } else {
                  window.location.reload();
                }
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
            >
              <LayoutDashboard className="w-4 h-4 text-gray-500" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
