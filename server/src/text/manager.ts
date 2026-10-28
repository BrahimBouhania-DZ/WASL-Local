import crypto from 'crypto'

export interface TextMessage {
  id: string
  text: string
  from: string
  fromType: 'pc' | 'phone'
  timestamp: number
  isUrl?: boolean
  senderDeviceId?: string
  targetDeviceIds?: string[]
}

const messages: TextMessage[] = []
const MAX_MESSAGES = 100

function checkIfUrl(str: string): boolean {
  try {
    const url = new URL(str.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function addTextMessage(
  text: string,
  from = 'Unknown',
  fromType: 'pc' | 'phone' = 'pc',
  senderDeviceId?: string,
  targetDeviceIds?: string[]
): TextMessage {
  const msg: TextMessage = {
    id: crypto.randomUUID(),
    text: text.trim(),
    from,
    fromType,
    timestamp: Date.now(),
    isUrl: checkIfUrl(text),
    senderDeviceId,
    targetDeviceIds: targetDeviceIds && targetDeviceIds.length > 0 ? targetDeviceIds : undefined
  }
  messages.unshift(msg)
  if (messages.length > MAX_MESSAGES) {
    messages.pop()
  }
  return msg
}

export function getTextMessages(): TextMessage[] {
  return messages
}

export function clearTextMessages() {
  messages.length = 0
}
