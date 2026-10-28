function getApiBase() {
  if ((import.meta as any).env?.VITE_API_BASE) {
    return (import.meta as any).env.VITE_API_BASE
  }
  const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost'
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
  return `${protocol}//${host}:8080`
}

const API_BASE = getApiBase()
export { API_BASE }

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`)
  return res.json()
}

export async function getInfo() {
  const res = await fetch(`${API_BASE}/info`)
  return res.json()
}

export async function getConnectInfo() {
  const res = await fetch(`${API_BASE}/connect`)
  return res.json()
}

// ─── Pairing ──────────────────────────────────────────────────────────────────

export async function createPairing() {
  const res = await fetch(`${API_BASE}/pair/create`, { method: 'POST' })
  return res.json() // returns { sessionId, code, expiresAt }
}

export async function verifyPairing(code: string, sessionId?: string, deviceName?: string, deviceType: 'pc' | 'phone' = 'phone') {
  const res = await fetch(`${API_BASE}/pair/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, sessionId, deviceName, deviceType })
  })
  return res.json()
}

export async function createQRPair() {
  const res = await fetch(`${API_BASE}/pair/qr/create`, { method: 'POST' })
  return res.json() // returns { sessionId, code, expiresAt, qrUrl }
}

export async function getQRPair(id: string) {
  const res = await fetch(`${API_BASE}/pair/qr/${id}`)
  return res.json()
}

// ─── Devices ──────────────────────────────────────────────────────────────────

export async function getDevices() {
  const res = await fetch(`${API_BASE}/devices`)
  return res.json()
}

export interface Device {
  id: string
  name: string
  type: 'pc' | 'phone'
  connectedAt: number
  lastSeen: number
  token?: string
}

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('linkdesk_auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Ensures the client has an auth token, requesting a host token if running on host/PC
 */
export async function ensureAuthToken(): Promise<string | null> {
  const token = localStorage.getItem('linkdesk_auth_token')
  if (token) return token
  try {
    const res = await fetch(`${API_BASE}/auth/host-token`, { method: 'POST' })
    const data = await res.json()
    if (data.ok && data.token) {
      localStorage.setItem('linkdesk_auth_token', data.token)
      if (data.deviceId) localStorage.setItem('linkdesk_device_id', data.deviceId)
      return data.token
    }
  } catch (e) {
    // Host token not available or rate limited
  }
  return null
}

export async function disconnectDevice(id: string) {
  const res = await fetch(`${API_BASE}/devices/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() }
  })
  return res.json()
}

// ─── Files ────────────────────────────────────────────────────────────────────

export async function listFiles() {
  const res = await fetch(`${API_BASE}/files/list`, {
    headers: { ...getAuthHeaders() }
  })
  return res.json() // returns { files: FileMetadata[] }
}

export function getDownloadUrl(savedName: string) {
  const token = localStorage.getItem('linkdesk_auth_token')
  const base = `${API_BASE}/files/download/${encodeURIComponent(savedName)}`
  return token ? `${base}?token=${encodeURIComponent(token)}` : base
}

export async function deleteFile(savedName: string) {
  const res = await fetch(`${API_BASE}/files/${encodeURIComponent(savedName)}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() }
  })
  return res.json()
}

export interface UploadProgress {
  percent: number
  loaded: number
  total: number
  speedBytesPerSec: number
}

/**
 * Ultra-fast raw chunked file upload with real-time speed and progress monitoring
 */
export function uploadFilesWithProgress(
  files: File[],
  targetDeviceIds?: string[],
  onProgress?: (progress: UploadProgress) => void
): Promise<{ ok: boolean; uploaded?: any[]; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()

    files.forEach((f) => formData.append('files', f))

    const myDeviceId = localStorage.getItem('linkdesk_device_id') || ''
    const myDeviceName = localStorage.getItem('linkdesk_device_name') || 'Device'
    formData.append('senderDeviceId', myDeviceId)
    formData.append('senderName', myDeviceName)

    if (targetDeviceIds && targetDeviceIds.length > 0) {
      formData.append('targetDeviceIds', JSON.stringify(targetDeviceIds))
    }

    const startTime = Date.now()

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100)
        const elapsedSec = (Date.now() - startTime) / 1000 || 0.001
        const speed = Math.round(event.loaded / elapsedSec)
        onProgress({
          percent,
          loaded: event.loaded,
          total: event.total,
          speedBytesPerSec: speed
        })
      }
    }

    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(res)
        } else {
          resolve({ ok: false, error: res.error || 'upload_failed' })
        }
      } catch (e) {
        resolve({ ok: false, error: 'invalid_response' })
      }
    }

    xhr.onerror = () => {
      resolve({ ok: false, error: 'network_error' })
    }

    xhr.open('POST', `${API_BASE}/files/upload`)
    const token = localStorage.getItem('linkdesk_auth_token')
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  })
}

// ─── Text & Links ─────────────────────────────────────────────────────────────

export async function sendText(
  text: string,
  from = 'PC',
  fromType: 'pc' | 'phone' = 'pc',
  targetDeviceIds?: string[]
) {
  const senderDeviceId = localStorage.getItem('linkdesk_device_id') || undefined
  const res = await fetch(`${API_BASE}/text/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ text, from, fromType, senderDeviceId, targetDeviceIds })
  })
  return res.json()
}

export async function getTextHistory() {
  const res = await fetch(`${API_BASE}/text/history`, {
    headers: { ...getAuthHeaders() }
  })
  return res.json()
}

// ─── Clipboard ────────────────────────────────────────────────────────────────

export async function syncClipboard(
  text: string,
  from = 'PC',
  fromType: 'pc' | 'phone' = 'pc',
  targetDeviceIds?: string[]
) {
  const senderDeviceId = localStorage.getItem('linkdesk_device_id') || undefined
  const res = await fetch(`${API_BASE}/clipboard/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ text, from, fromType, senderDeviceId, targetDeviceIds })
  })
  return res.json()
}

export async function getLatestClipboard() {
  const res = await fetch(`${API_BASE}/clipboard/latest`, {
    headers: { ...getAuthHeaders() }
  })
  return res.json()
}

// ─── Session Purge ────────────────────────────────────────────────────────────

export async function purgeSessionApi() {
  const res = await fetch(`${API_BASE}/session/purge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  })
  return res.json()
}
