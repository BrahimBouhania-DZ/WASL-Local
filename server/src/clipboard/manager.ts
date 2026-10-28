export interface ClipboardEntry {
  text: string
  from: string
  fromType: 'pc' | 'phone'
  updatedAt: number
  senderDeviceId?: string
  targetDeviceIds?: string[]
}

let latestClipboard: ClipboardEntry | null = null

export function setClipboard(
  text: string,
  from = 'Unknown',
  fromType: 'pc' | 'phone' = 'pc',
  senderDeviceId?: string,
  targetDeviceIds?: string[]
): ClipboardEntry {
  latestClipboard = {
    text,
    from,
    fromType,
    updatedAt: Date.now(),
    senderDeviceId,
    targetDeviceIds: targetDeviceIds && targetDeviceIds.length > 0 ? targetDeviceIds : undefined
  }
  return latestClipboard
}

export function getClipboard(): ClipboardEntry | null {
  return latestClipboard
}
