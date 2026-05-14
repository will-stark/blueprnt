'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ERROR-BOUNDARY] Uncaught React error:', error.message)
    console.error('[ERROR-BOUNDARY] Stack:', error.stack)
    console.error('[ERROR-BOUNDARY] Component stack:', info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-dvh gap-4 px-6 text-center font-sans">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Something went wrong. Please reload the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
