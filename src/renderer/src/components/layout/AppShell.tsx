import { Outlet } from 'react-router-dom'
import { Component, type ReactNode, type ErrorInfo, type CSSProperties } from 'react'
import Sidebar from './Sidebar'
import TopHeader from './TopHeader'
import { UploadProvider } from '../../hooks/useUpload'
import { ToastProvider } from '../../hooks/useToast'
import ToastContainer from '../ui/ToastContainer'
import NetworkGuard from '../ui/NetworkGuard'
import GlobalErrorHandler from '../ui/GlobalErrorHandler'

class PageErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(_err: Error, _info: ErrorInfo) {}
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="font-display text-[18px] font-bold text-[#09090b]">Something went wrong</p>
          <p className="font-display text-[13px] text-[#71717b]">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="rounded-[8px] bg-[#2b7fff] px-4 py-2 font-display text-[13px] font-semibold text-white"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function AppShell(): JSX.Element {
  return (
    <ToastProvider>
      <UploadProvider>
        <div className="flex h-full w-full flex-col">
          {/* Titlebar drag zone — matches titleBarOverlay height (32px) so content clears native Win controls */}
          <div
            className="h-8 w-full shrink-0 bg-white"
            style={{ WebkitAppRegion: 'drag' } as CSSProperties}
          />
          <div className="flex flex-1 overflow-hidden bg-[#f8fafc]">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <TopHeader />
              <main className="flex-1 overflow-y-auto p-6">
                <NetworkGuard>
                  <PageErrorBoundary>
                    <Outlet />
                  </PageErrorBoundary>
                </NetworkGuard>
              </main>
            </div>
          </div>
        </div>
        <GlobalErrorHandler />
        <ToastContainer />
      </UploadProvider>
    </ToastProvider>
  )
}
