import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileUp, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useWs } from '../../context/WsContext'
import { useToast } from '../../context/ToastContext'

export interface IncomingTransferRequest {
  transferId: string
  fileName: string
  fileSize: number
  fileType: string
  senderName: string
  senderDeviceId: string
}

export function TransferConsentModal() {
  const { t } = useTranslation()
  const { subscribe, send } = useWs()
  const { info } = useToast()
  const [request, setRequest] = useState<IncomingTransferRequest | null>(null)
  const [timeLeft, setTimeLeft] = useState(60)

  useEffect(() => {
    const unsubscribe = subscribe((msg) => {
      if (msg.type === 'transfer:incoming' && msg.payload) {
        setRequest(msg.payload as IncomingTransferRequest)
        setTimeLeft(60)
        info(`${msg.payload.senderName || 'جهاز'} يطلب إرسال ملف: ${msg.payload.fileName}`)
      }
    })
    return () => unsubscribe()
  }, [subscribe, info])

  // Countdown timer
  useEffect(() => {
    if (!request) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleDecline('timeout')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [request])

  const handleAccept = () => {
    if (!request) return
    send({
      type: 'transfer:respond',
      payload: {
        transferId: request.transferId,
        decision: 'accept',
        recipientDeviceId: localStorage.getItem('linkdesk_device_id')
      },
      targetDeviceIds: request.senderDeviceId
    })
    setRequest(null)
  }

  const handleDecline = (reason = 'user_declined') => {
    if (!request) return
    send({
      type: 'transfer:respond',
      payload: {
        transferId: request.transferId,
        decision: 'reject',
        reason
      },
      targetDeviceIds: request.senderDeviceId
    })
    setRequest(null)
  }

  if (!request) return null

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          background: 'var(--bg-primary)',
          border: '1px solid var(--primary)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          borderRadius: 'var(--radius-lg, 12px)',
          textAlign: 'center',
          animation: 'scaleIn 0.2s ease-out'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.15)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}
        >
          <FileUp size={28} />
        </div>

        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
          {t('transfer.consentTitle') || 'طلب استلام ملف جديد'}
        </h3>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          {t('transfer.consentFrom') || 'يرغب الجهاز'}{' '}
          <strong style={{ color: 'var(--primary)' }}>{request.senderName || 'جهاز متصل'}</strong>{' '}
          {t('transfer.consentAction') || 'في إرسال هذا الملف إليك:'}
        </p>

        <div
          style={{
            padding: '1rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'left',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', wordBreak: 'break-all', marginBottom: '0.25rem' }}>
            {request.fileName}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{formatSize(request.fileSize)}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: timeLeft <= 15 ? 'var(--error)' : 'var(--text-secondary)' }}>
              <Clock size={13} />
              {timeLeft}s
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            className="btn btn-danger"
            onClick={() => handleDecline('user_declined')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <XCircle size={18} />
            {t('transfer.reject') || 'رفض'}
          </button>

          <button
            className="btn btn-primary"
            onClick={handleAccept}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <CheckCircle size={18} />
            {t('transfer.accept') || 'قبول واستلام'}
          </button>
        </div>
      </div>
    </div>
  )
}
