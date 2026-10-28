import { createContext, useContext, useState, useCallback } from 'react'

export type ToastType = 'success' | 'info' | 'warning' | 'error'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  message: string
  durationMs?: number
  action?: ToastAction
}

interface ToastContextType {
  toasts: ToastItem[]
  showToast: (toast: Omit<ToastItem, 'id'>) => string
  dismissToast: (id: string) => void
  success: (message: string, action?: ToastAction) => string
  info: (message: string, action?: ToastAction) => string
  warning: (message: string, action?: ToastAction) => string
  error: (message: string, action?: ToastAction) => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const duration = item.durationMs ?? (item.action ? 10000 : 4000)
      const toast: ToastItem = { ...item, id }

      setToasts((prev) => [toast, ...prev].slice(0, 5))

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id)
        }, duration)
      }

      return id
    },
    [dismissToast]
  )

  const success = useCallback((message: string, action?: ToastAction) => showToast({ type: 'success', message, action }), [showToast])
  const info = useCallback((message: string, action?: ToastAction) => showToast({ type: 'info', message, action }), [showToast])
  const warning = useCallback((message: string, action?: ToastAction) => showToast({ type: 'warning', message, action }), [showToast])
  const error = useCallback((message: string, action?: ToastAction) => showToast({ type: 'error', message, action }), [showToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, success, info, warning, error }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
