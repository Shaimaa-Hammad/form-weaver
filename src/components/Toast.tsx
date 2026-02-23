import type { ToastMessage } from '@domain'
import styles from './Toast.module.css'

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
  const variantClass = toast.kind === 'error' ? styles.toastError : styles.toastSuccess

  return (
    <div className={`${styles.toast} ${variantClass}`} role={role} aria-live={live}>
      <p className={styles.toastMessage}>{toast.message}</p>
      <button type="button" className={styles.toastClose} onClick={onClose}>
        Close
      </button>
    </div>
  )
}
