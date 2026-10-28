/**
 * Resilient clipboard utility that works across modern secure contexts (HTTPS/localhost)
 * as well as non-secure LAN HTTP on Android and iOS browsers.
 */

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false

  // 1. Try modern navigator.clipboard API if available and permitted
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through to legacy textarea method
    }
  }

  // 2. Legacy textarea fallback for mobile HTTP LAN
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text

    // Avoid scrolling to bottom
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    textArea.style.pointerEvents = 'none'

    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    // For iOS Safari
    textArea.setSelectionRange(0, 999999)

    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch (err) {
    console.warn('Fallback copy failed', err)
    return false
  }
}

export async function readTextFromClipboard(): Promise<string | null> {
  if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
    try {
      return await navigator.clipboard.readText()
    } catch {
      return null
    }
  }
  return null
}
