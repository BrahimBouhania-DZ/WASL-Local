import { describe, it, expect } from 'vitest'
import { createPairingSession, verifyCode, getSession } from './manager.js'

describe('Pairing Manager', () => {
  it('generates a 6-digit numeric pairing code', () => {
    const session = createPairingSession(60000)
    expect(session.id).toBeDefined()
    expect(session.code).toMatch(/^\d{6}$/)
    expect(session.expiresAt).toBeGreaterThan(Date.now())
  })

  it('successfully verifies a valid pairing code', () => {
    const session = createPairingSession(60000)
    const result = verifyCode(session.code, session.id)
    expect(result.ok).toBe(true)
    expect(result.sessionId).toBe(session.id)
  })

  it('rejects an invalid pairing code and counts attempts', () => {
    const session = createPairingSession(60000)
    const result = verifyCode('000000', session.id)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('invalid')

    const current = getSession(session.id)
    expect(current?.attempts).toBe(1)
  })

  it('locks after too many failed attempts (5 attempts)', () => {
    const session = createPairingSession(60000)
    for (let i = 0; i < 5; i++) {
      verifyCode('111111', session.id)
    }
    const sixthTry = verifyCode(session.code, session.id)
    expect(sixthTry.ok).toBe(false)
    expect(sixthTry.reason).toBe('too_many_attempts')
  })

  it('rejects an expired pairing session', () => {
    const session = createPairingSession(-1000) // already expired
    const result = verifyCode(session.code, session.id)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('expired')
  })

  it('prevents reusing an already used code', () => {
    const session = createPairingSession(60000)
    const first = verifyCode(session.code, session.id)
    expect(first.ok).toBe(true)

    const second = verifyCode(session.code, session.id)
    expect(second.ok).toBe(false)
    expect(second.reason).toBe('used')
  })
})
