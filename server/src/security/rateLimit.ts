type Attempt = { count: number; lastAt: number; blockedUntil?: number }

const attempts = new Map<string, Attempt>()

export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 60000, blockMs = 60000): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const a = attempts.get(key)
  if (a?.blockedUntil && a.blockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((a.blockedUntil - now) / 1000) }
  }
  if (!a || now - a.lastAt > windowMs) {
    attempts.set(key, { count: 1, lastAt: now })
    return { allowed: true }
  }
  if (a.count >= maxAttempts) {
    a.blockedUntil = now + blockMs
    a.count++
    a.lastAt = now
    return { allowed: false, retryAfter: Math.ceil(blockMs / 1000) }
  }
  a.count++
  a.lastAt = now
  return { allowed: true }
}

export function resetRateLimit(key: string) {
  attempts.delete(key)
}
