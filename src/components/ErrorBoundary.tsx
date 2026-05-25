import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Velour Error Boundary caught unhandled failure:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-850/60 p-8 rounded-2xl space-y-6 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-350 mx-auto">
              <AlertCircle className="w-5 h-5 text-zinc-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-200">Dashboard temporary recovery</h3>
              <p className="text-[11px] text-zinc-455 leading-relaxed max-w-xs mx-auto">
                The dashboard encountered a client-side interface error. Your raw credentials and registered removal queues remain fully secure and unaffected.
              </p>
            </div>

            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl transition"
            >
              Reload Dashboard Interface
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
