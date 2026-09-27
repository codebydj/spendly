import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Spendly ErrorBoundary caught exception]:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="card-level-2"
          style={{
            padding: '32px 24px',
            margin: '16px 0',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            backgroundColor: 'rgba(244, 63, 94, 0.06)',
            borderColor: 'rgba(244, 63, 94, 0.25)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-danger-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--status-danger)',
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {this.props.fallbackTitle || "Couldn't load transactions"}
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '440px' }}>
              {this.props.fallbackMessage || 'Your transaction data could not be displayed cleanly. Please try again.'}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="btn btn-primary"
            style={{ padding: '8px 18px', minHeight: '38px', fontSize: '0.86rem', marginTop: '6px' }}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
