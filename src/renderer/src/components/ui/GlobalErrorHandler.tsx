import { useEffect } from 'react'
import { useToast } from '../../hooks/useToast'

export default function GlobalErrorHandler(): null {
  const { toast } = useToast()

  useEffect(() => {
    const handleUnhandled = (event: PromiseRejectionEvent): void => {
      event.preventDefault()
      const msg = event.reason?.message ?? String(event.reason)

      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        toast('error', 'Authentication error', 'Your session may have expired. Please sign in again.')
      } else if (msg.includes('403')) {
        toast('error', 'Access denied', 'You don\'t have permission to do that.')
      } else if (msg.includes('404')) {
        toast('error', 'Not found', 'The requested file or folder could not be found.')
      } else if (msg.includes('429')) {
        toast('warning', 'Too many requests', 'Slow down — server is rate-limiting requests.')
      } else if (msg.includes('500') || msg.includes('502') || msg.includes('503')) {
        toast('error', 'Server error', 'The server returned an error. Try again in a moment.')
      } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        toast('error', 'Network error', 'Could not reach the server. Check your connection.')
      } else if (msg.toLowerCase().includes('timeout')) {
        toast('warning', 'Request timed out', 'The server took too long to respond.')
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandled)
    return () => window.removeEventListener('unhandledrejection', handleUnhandled)
  }, [toast])

  return null
}
