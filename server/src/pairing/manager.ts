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
  const num = crypto.randomInt(100000, 1000000)
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

export function verifyCode(code: string, sessionId?: string): { ok: boolean; sessionId?: string; reason?: string } {
  const now = Date.now()
  
  if (sessionId) {
    const session = sessions.get(sessionId)
    if (!session) {
      return { ok: false, reason: 'invalid' }
    }
    if (session.expiresAt < now) {
      sessions.delete(sessionId)
      return { ok: false, reason: 'expired' }
    }
    if (session.used) {
      return { ok: false, reason: 'used' }
    }
    session.attempts++
    if (session.attempts > 5) {
      return { ok: false, reason: 'too_many_attempts' }
    }
    if (session.code !== code) {
      return { ok: false, reason: 'invalid' }
    }
    session.used = true
    return { ok: true, sessionId: session.id }
  }

  for (const [id, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(id)
      continue
    }
    if (session.code === code) {
      session.attempts++
      if (session.attempts > 5) {
        return { ok: false, reason: 'too_many_attempts' }
      }
      if (session.used) {
        return { ok: false, reason: 'used' }
      }
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
