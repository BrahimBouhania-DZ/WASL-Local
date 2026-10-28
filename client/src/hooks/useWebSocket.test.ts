import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWebSocket } from './useWebSocket'

describe('useWebSocket Hook', () => {
  it('initializes in disconnected or connecting state', () => {
    const { result } = renderHook(() => useWebSocket())
    expect(['disconnected', 'connecting']).toContain(result.current.status)
  })

  it('provides a send function', () => {
    const { result } = renderHook(() => useWebSocket())
    expect(typeof result.current.send).toBe('function')
  })
})
