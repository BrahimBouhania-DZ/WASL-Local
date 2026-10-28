import { describe, it, expect } from 'vitest'
import { isAllowedFile } from './types.js'
import { getSafeFilename } from './manager.js'

describe('File Security & Types', () => {
  it('allows safe document extensions (pdf, txt, png, jpg, zip)', () => {
    expect(isAllowedFile('notes.txt').allowed).toBe(true)
    expect(isAllowedFile('photo.png').allowed).toBe(true)
    expect(isAllowedFile('document.pdf').allowed).toBe(true)
    expect(isAllowedFile('archive.zip').allowed).toBe(true)
  })

  it('blocks dangerous executable files', () => {
    expect(isAllowedFile('malware.exe').allowed).toBe(false)
    expect(isAllowedFile('app.apk').allowed).toBe(false)
    expect(isAllowedFile('installer.bat').allowed).toBe(false)
    expect(isAllowedFile('driver.msi').allowed).toBe(false)
  })

  it('blocks files without extension', () => {
    expect(isAllowedFile('somefile').allowed).toBe(false)
  })

  it('generates a safe UUID-based filename preserving extension', () => {
    const safe = getSafeFilename('my proposal 2026.pdf')
    expect(safe).toMatch(/\.pdf$/)
    expect(safe).not.toContain('my proposal')
  })
})
