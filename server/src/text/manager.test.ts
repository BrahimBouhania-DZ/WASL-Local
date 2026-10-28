import { describe, it, expect } from 'vitest'
import { addTextMessage, getTextMessages } from './manager.js'

describe('Text Messages Manager', () => {
  it('adds and retrieves text messages', () => {
    const msg = addTextMessage('https://example.com/test', 'PC', 'pc')
    expect(msg.id).toBeDefined()
    expect(msg.text).toBe('https://example.com/test')
    expect(msg.from).toBe('PC')
    expect(msg.fromType).toBe('pc')

    const list = getTextMessages()
    expect(list.some(m => m.id === msg.id)).toBe(true)
  })
})
