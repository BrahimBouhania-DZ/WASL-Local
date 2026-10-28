import crypto from 'crypto'
import { createPairingSession } from './manager.js'

export type QRPairSession = {
  id: string
  code: string
  expiresAt: number
  createdAt: number
}

const qrSessions = new Map<string, QRPairSession>()

export function createQRPairSession(ttlMs = 120000): QRPairSession {
  const session = createPairingSession(ttlMs)
  const qrSession: QRPairSession = {
    id: session.id,
    code: session.code,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt
  }
  qrSessions.set(qrSession.id, qrSession)
  return qrSession
}

export function getQRPairSession(id: string): QRPairSession | undefined {
  return qrSessions.get(id)
}
