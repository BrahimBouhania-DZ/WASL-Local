import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, resetRateLimit } from './rateLimit.js'

describe('Rate Limiter', () => {
  beforeEach(() => {
    resetRateLimit('test-ip')
  })

  it('allows requests within limit', () => {
    const res1 = checkRateLimit('test-ip', 3, 1000, 5000)
    expect(res1.allowed).toBe(true)
    const res2 = checkRateLimit('test-ip', 3, 1000, 5000)
    expect(res2.allowed).toBe(true)
  })

  it('blocks requests exceeding max attempts', () => {
    checkRateLimit('test-ip', 2, 1000, 5000)
    checkRateLimit('test-ip', 2, 1000, 5000)
    const blocked = checkRateLimit('test-ip', 2, 1000, 5000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  it('resets attempts when explicitly requested', () => {
    checkRateLimit('test-ip', 1, 1000, 5000)
    resetRateLimit('test-ip')
    const allowed = checkRateLimit('test-ip', 1, 1000, 5000)
    expect(allowed.allowed).toBe(true)
  })
})
