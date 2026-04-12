import { Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-50">
          <p className="text-gray-600">Something went wrong.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-500 text-white rounded-full"
            aria-label="Reload app"
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
