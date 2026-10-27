import crypto from 'crypto'

export type PairingSession = {
  id: string
  code: string
  createdAt: number
  expiresAt: number
  used: boolean
  attempts: number
}

const sessions = new Map<string, PairingSession>()

function generateCode(): string {
  const num = crypto.randomInt(100000, 10000000)
  return num.toString()
}

export function createPairingSession(ttlMs = 120000): PairingSession {
  const id = crypto.randomUUID()
  const code = generateCode()
  const now = Date.now()
  const session: PairingSession = {
    id,
    code,
    createdAt: now,
    expiresAt: now + ttlMs,
    used: false,
    attempts: 0
  }
  sessions.set(id, session)
  return session
}

export function verifyCode(code: string): { ok: boolean; sessionId?: string; reason?: string } {
  const now = Date.now()
  for (const [id, session] of sessions.entries()) {
    if (session.code === code) {
      if (session.used) {
        return { ok: false, reason: 'used' }
      }
      if (session.expiresAt < now) {
        sessions.delete(id)
        return { ok: false, reason: 'expired' }
      }
      if (session.attempts >= 5) {
        return { ok: false, reason: 'too_many_attempts' }
      }
      session.attempts++
      session.used = true
      return { ok: true, sessionId: id }
    }
  }
  return { ok: false, reason: 'invalid' }
}

export function getSession(id: string): PairingSession | undefined {
  return sessions.get(id)
}

export function clearExpired() {
  const now = Date.now()
  for (const [id, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(id)
    }
  }
}
