import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopHeader from './TopHeader'
import { UploadProvider } from '../../hooks/useUpload'
import { ToastProvider } from '../../hooks/useToast'
import ToastContainer from '../ui/ToastContainer'
import NetworkGuard from '../ui/NetworkGuard'
import GlobalErrorHandler from '../ui/GlobalErrorHandler'

export default function AppShell(): JSX.Element {
  return (
    <ToastProvider>
      <UploadProvider>
        <div className="flex h-full w-full bg-[#f8fafc] dark:bg-[#09090b]">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopHeader />
            <main className="flex-1 overflow-y-auto p-6">
              <NetworkGuard>
                <Outlet />
              </NetworkGuard>
            </main>
          </div>
        </div>
        <GlobalErrorHandler />
        <ToastContainer />
      </UploadProvider>
    </ToastProvider>
  )
}
