import crypto from 'crypto'

export interface SessionToken {
  token: string
  deviceId: string
  createdAt: number
  lastActive: number
}

// In-memory store of active device session tokens: token -> SessionToken
const tokenStore = new Map<string, SessionToken>()

// deviceId -> token mapping for fast lookup
const deviceTokenMap = new Map<string, string>()

/**
 * Generate a cryptographically secure 32-byte hex auth token for a device
 */
export function generateDeviceToken(deviceId: string): string {
  // If device already has a token, we can refresh it or reuse it
  const existing = deviceTokenMap.get(deviceId)
  if (existing && tokenStore.has(existing)) {
    const session = tokenStore.get(existing)!
    session.lastActive = Date.now()
    return existing
  }

  const token = crypto.randomBytes(32).toString('hex')
  const session: SessionToken = {
    token,
    deviceId,
    createdAt: Date.now(),
    lastActive: Date.now()
  }

  tokenStore.set(token, session)
  deviceTokenMap.set(deviceId, token)
  return token
}

/**
 * Validate a bearer token and return the associated deviceId, or null if invalid
 */
export function validateDeviceToken(token?: string): SessionToken | null {
  if (!token) return null
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim()
  const session = tokenStore.get(cleanToken)
  if (!session) return null

  // Update last active timestamp
  session.lastActive = Date.now()
  return session
}

/**
 * Invalidate a device's session token on disconnect or unpair
 */
export function revokeDeviceToken(deviceId: string) {
  const token = deviceTokenMap.get(deviceId)
  if (token) {
    tokenStore.delete(token)
    deviceTokenMap.delete(deviceId)
  }
}

/**
 * Get the token for a known deviceId
 */
export function getTokenForDevice(deviceId: string): string | undefined {
  return deviceTokenMap.get(deviceId)
}

/**
 * Clear all tokens (useful for testing)
 */
export function clearAllTokens() {
  tokenStore.clear()
  deviceTokenMap.clear()
}
