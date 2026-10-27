import crypto from 'crypto'

export type Device = {
  id: string
  name: string
  type: 'pc' | 'phone'
  connectedAt: number
  lastSeen: number
}

const devices = new Map<string, Device>()
const sessions = new Map<string, { deviceId: string; socketId: string }>()

export function addDevice(name: string, type: 'pc' | 'phone'): Device {
  const id = crypto.randomUUID()
  const device: Device = {
    id,
    name,
    type,
    connectedAt: Date.now(),
    lastSeen: Date.now()
  }
  devices.set(id, device)
  return device
}

export function getDevices(): Device[] {
  return Array.from(devices.values())
}

export function getDevice(id: string): Device | undefined {
  return devices.get(id)
}

export function removeDevice(id: string): boolean {
  devices.delete(id)
  // remove sessions
  for (const [sid, s] of sessions.entries()) {
    if (s.deviceId === id) sessions.delete(sid)
  }
  return true
}

export function touchDevice(id: string) {
  const d = devices.get(id)
  if (d) d.lastSeen = Date.now()
}

export function bindSession(socketId: string, deviceId: string) {
  sessions.set(socketId, { deviceId, socketId })
}

export function unbindSession(socketId: string) {
  sessions.delete(socketId)
}

export function getSessionBySocket(socketId: string) {
  return sessions.get(socketId)
}
