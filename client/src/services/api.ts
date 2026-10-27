const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8080'

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`)
  return res.json()
}

export async function getInfo() {
  const res = await fetch(`${API_BASE}/info`)
  return res.json()
}

export async function createPairing() {
  const res = await fetch(`${API_BASE}/pair/create`, { method: 'POST' })
  return res.json()
}

export async function verifyPairing(code: string) {
  const res = await fetch(`${API_BASE}/pair/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  })
  return res.json()
}

export async function getDevices() {
  const res = await fetch(`${API_BASE}/devices`)
  return res.json()
}

export async function disconnectDevice(id: string) {
  const res = await fetch(`${API_BASE}/devices/${id}`, { method: 'DELETE' })
  return res.json()
}
