import React from 'react';

/**
 * Catches render errors in a subtree and shows a graceful fallback
 * instead of letting the whole app unmount to a white screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Something went wrong' };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '2rem',
            marginTop: '1rem',
            borderRadius: 16,
            border: '1px dashed #f43f5e',
            background: 'rgba(244, 63, 94, 0.05)',
            color: '#f43f5e',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.95rem' }}>
            Something went wrong loading this section.
          </p>
          <code
            style={{
              display: 'block',
              marginTop: '0.6rem',
              fontSize: '0.78rem',
              color: '#0f172a',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '0.5rem 0.75rem',
            }}
          >
            {this.state.message}
          </code>
          {this.props.fallback ?? null}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
