import { describe, it, expect, beforeEach } from 'vitest'
import { generateDeviceToken, validateDeviceToken, revokeDeviceToken, clearAllTokens } from './auth.js'

describe('Device Auth Token System', () => {
  beforeEach(() => {
    clearAllTokens()
  })

  it('generates a 64-character hex token for a device', () => {
    const token = generateDeviceToken('dev-123')
    expect(token).toBeDefined()
    expect(token.length).toBe(64)
    expect(/^[a-f0-9]{64}$/.test(token)).toBe(true)
  })

  it('validates a valid token and retrieves the session', () => {
    const token = generateDeviceToken('dev-123')
    const session = validateDeviceToken(token)
    expect(session).not.toBeNull()
    expect(session?.deviceId).toBe('dev-123')
  })

  it('supports Bearer prefix in token validation', () => {
    const token = generateDeviceToken('dev-123')
    const session = validateDeviceToken(`Bearer ${token}`)
    expect(session).not.toBeNull()
    expect(session?.deviceId).toBe('dev-123')
  })

  it('returns null for an invalid or non-existent token', () => {
    const session = validateDeviceToken('invalid-token-123')
    expect(session).toBeNull()
  })

  it('revokes a device token when requested', () => {
    const token = generateDeviceToken('dev-123')
    revokeDeviceToken('dev-123')
    const session = validateDeviceToken(token)
    expect(session).toBeNull()
  })
})
