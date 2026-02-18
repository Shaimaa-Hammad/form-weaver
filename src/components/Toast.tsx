import type { ToastMessage } from '@domain/types'

interface ToastProps {
  toast?: ToastMessage
  onClose: () => void
}

export function Toast({ toast, onClose }: ToastProps) {
  if (!toast) {
    return null
  }

  const role = toast.kind === 'error' ? 'alert' : 'status'
  const live = toast.kind === 'error' ? 'assertive' : 'polite'

  return (
    <div className={`toast toast-${toast.kind}`} role={role} aria-live={live}>
      <p className="toast-message">{toast.message}</p>
      <button type="button" className="toast-close" onClick={onClose}>
        Close
      </button>
    </div>
  )
}
