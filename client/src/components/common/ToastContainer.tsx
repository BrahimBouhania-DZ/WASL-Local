import { useToast } from '../../context/ToastContext'
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react'

export function ToastContainer() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        maxWidth: '380px',
        width: 'calc(100% - 2rem)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success'
        const isError = toast.type === 'error'
        const isWarning = toast.type === 'warning'
        const borderColor = isSuccess
          ? 'var(--success, #22c55e)'
          : isError
          ? 'var(--error, #ef4444)'
          : isWarning
          ? 'var(--warning, #f59e0b)'
          : 'var(--primary, #3b82f6)'

        const Icon = isSuccess
          ? CheckCircle2
          : isError
          ? XCircle
          : isWarning
          ? AlertTriangle
          : Info

        return (
          <div
            key={toast.id}
            style={{
              background: 'var(--bg-primary, #1e1e2d)',
              border: `1px solid ${borderColor}`,
              borderLeft: `4px solid ${borderColor}`,
              borderRadius: 'var(--radius-md, 8px)',
              padding: '0.85rem 1rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              pointerEvents: 'auto',
              backdropFilter: 'blur(8px)',
              animation: 'slideInToast 0.25s ease-out'
            }}
          >
            <div style={{ color: borderColor, marginTop: '2px', flexShrink: 0 }}>
              <Icon size={20} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {toast.title && (
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>
                  {toast.title}
                </div>
              )}
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: 1.4 }}>
                {toast.message}
              </div>

              {toast.action && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    toast.action?.onClick()
                    dismissToast(toast.id)
                  }}
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px'
                  }}
                >
                  {toast.action.label}
                </button>
              )}
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.7
              }}
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
