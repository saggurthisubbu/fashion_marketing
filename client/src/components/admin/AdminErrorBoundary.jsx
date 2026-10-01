import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ORDER UI] Orders render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-4 rounded-3xl bg-zinc-900 border border-red-500/40 text-center space-y-4 shadow-xl animate-in fade-in">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-black text-white text-lg">
              Unable to load {this.props.sectionName || 'this section'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              {this.state.error?.message || 'An unexpected rendering error occurred. Your other dashboard data is safe.'}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
