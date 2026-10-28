import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDevices, purgeSessionApi } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { FolderOpen, FileText, Clipboard, Monitor, Trash2, ArrowRight } from 'lucide-react'

interface Device {
  id: string
  name: string
  type: 'pc' | 'phone'
}

export function MobileDashboard() {
  const { success, warning } = useToast()
  const [hostPc, setHostPc] = useState<Device | null>(null)
  const myDeviceId = localStorage.getItem('linkdesk_device_id') || ''
  const myDeviceName = localStorage.getItem('linkdesk_device_name') || 'هاتفي'

  useEffect(() => {
    async function fetchHost() {
      try {
        const res = await getDevices()
        if (res.devices) {
          // Find the connected host PC (device type 'pc' and not me)
          const host = res.devices.find((d: Device) => d.type === 'pc' && d.id !== myDeviceId)
          if (host) setHostPc(host)
        }
      } catch {
        /* ignore */
      }
    }
    fetchHost()
  }, [myDeviceId])

  const handleDisconnect = async () => {
    if (!window.confirm('هل تريد إنهاء الاتصال وحذف بيانات الجلسة؟')) return
    try {
      await purgeSessionApi()
      localStorage.clear()
      success('تم إنهاء الجلسة ومسح البيانات')
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch {
      warning('تعذر إنهاء الجلسة')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Host Connection Header Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.12), rgba(0, 136, 255, 0.05))',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
            متصل بالحاسوب الآن
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {hostPc ? hostPc.name : 'الحاسوب المضيف (Host PC)'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            هذا الجهاز: <strong style={{ color: 'var(--primary)' }}>{myDeviceName}</strong>
          </div>
        </div>

        <button
          onClick={handleDisconnect}
          className="btn"
          style={{
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: 'var(--error)',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.4rem 0.65rem'
          }}
          title="قطع الاتصال ومسح البيانات"
        >
          <Trash2 size={14} />
          إنهاء الجلسة
        </button>
      </div>

      {/* Quick Action Cards on Mobile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Link
          to="/files"
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textDecoration: 'none',
            color: 'inherit',
            padding: '1rem',
            transition: 'transform 0.15s, border-color 0.15s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(0, 212, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <FolderOpen size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>إرسال واستلام الملفات</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>إرسال صور وفيديوهات فوراً للحاسوب أو تحميل الواصل إليك</div>
            </div>
          </div>
          <ArrowRight size={18} color="var(--text-secondary)" />
        </Link>

        <Link
          to="/clipboard"
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textDecoration: 'none',
            color: 'inherit',
            padding: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
              <Clipboard size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>الحافظة المشتركة</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>نسخ النصوص والروابط بنقرة واحدة بين الأجهزة</div>
            </div>
          </div>
          <ArrowRight size={18} color="var(--text-secondary)" />
        </Link>

        <Link
          to="/screen"
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textDecoration: 'none',
            color: 'inherit',
            padding: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(0, 136, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
              <Monitor size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>مشاهدة شاشة الحاسوب</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>بث شاشة الكمبيوتر مباشرة أمامك على الهاتف بملء الشاشة</div>
            </div>
          </div>
          <ArrowRight size={18} color="var(--text-secondary)" />
        </Link>

        <Link
          to="/text"
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textDecoration: 'none',
            color: 'inherit',
            padding: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
              <FileText size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>الرسائل والنصوص السريعة</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>تبادل الروابط والملاحظات المباشرة مع الحاسوب</div>
            </div>
          </div>
          <ArrowRight size={18} color="var(--text-secondary)" />
        </Link>
      </div>
    </div>
  )
}
