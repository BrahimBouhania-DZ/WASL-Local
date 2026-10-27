import { clearExpired } from './manager.js'

export function startPairingCleanup(intervalMs = 60000) {
  clearExpired()
  setInterval(() => {
    clearExpired()
  }, intervalMs)
}
