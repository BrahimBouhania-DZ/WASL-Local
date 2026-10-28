import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Smartphone, Monitor, Check } from 'lucide-react'
import { getDevices, Device } from '../../services/api'
import { useWs } from '../../context/WsContext'
import { useTarget } from '../../context/TargetContext'

interface DeviceSelectorProps {
  disabled?: boolean
}

export function DeviceSelector({ disabled }: DeviceSelectorProps = {}) {
  const { t } = useTranslation()
  const { subscribe } = useWs()
  const { selectedTargetIds, setSelectedTargetIds, isAll } = useTarget()
  const [devices, setDevices] = useState<Device[]>([])

  // Current client device id (to filter itself out)
  const myDeviceId = localStorage.getItem('linkdesk_device_id') || ''

  const loadDevices = async () => {
    try {
      const res = await getDevices()
      if (res && res.devices) {
        setDevices(res.devices.filter((d: Device) => d.id !== myDeviceId))
      }
    } catch (err) {
      console.error('Failed to load devices for selector:', err)
    }
  }

  useEffect(() => {
    loadDevices()
    const unsubscribe = subscribe((msg) => {
      if (msg.type === 'devices:update') {
        loadDevices()
      }
    })
    return () => unsubscribe()
  }, [subscribe, myDeviceId])

  const handleSelectAll = () => {
    setSelectedTargetIds([]) // empty array represents broadcast to all
  }

  const handleToggleDevice = (id: string) => {
    if (isAll) {
      // Switching from all to a specific single device
      setSelectedTargetIds([id])
    } else {
      if (selectedTargetIds.includes(id)) {
        const next = selectedTargetIds.filter((item) => item !== id)
        // If nothing selected, revert to all
        setSelectedTargetIds(next)
      } else {
        setSelectedTargetIds([...selectedTargetIds, id])
      }
    }
  }

  return (
    <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Users size={16} color="var(--primary)" />
          {t('target.title')}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #888)' }}>
          {isAll
            ? t('target.allSelected')
            : `${selectedTargetIds.length} ${t('target.countSelected')}`}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {/* All Devices pill */}
        <button
          type="button"
          disabled={disabled}
          onClick={handleSelectAll}
          className="btn btn-sm"
          style={{
            background: isAll ? 'var(--primary)' : 'var(--bg-primary)',
            color: isAll ? '#fff' : 'var(--text-primary)',
            border: `1px solid ${isAll ? 'var(--primary)' : 'var(--border)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full, 9999px)',
            cursor: 'pointer'
          }}
        >
          {isAll && <Check size={14} />}
          <Users size={14} />
          {t('target.all')}
        </button>

        {/* Individual devices pills */}
        {devices.map((device) => {
          const isSelected = !isAll && selectedTargetIds.includes(device.id)
          const Icon = device.type === 'phone' ? Smartphone : Monitor

          return (
            <button
              key={device.id}
              type="button"
              disabled={disabled}
              onClick={() => handleToggleDevice(device.id)}
              className="btn btn-sm"
              style={{
                background: isSelected ? 'var(--primary)' : 'var(--bg-primary)',
                color: isSelected ? '#fff' : 'var(--text-primary)',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full, 9999px)',
                cursor: 'pointer'
              }}
            >
              {isSelected && <Check size={14} />}
              <Icon size={14} />
              <span>{device.name}</span>
            </button>
          )
        })}

        {devices.length === 0 && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
            {t('target.noOtherDevices')}
          </span>
        )}
      </div>
    </div>
  )
}
