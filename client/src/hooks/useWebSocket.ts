import { useEffect, useRef, useState, useCallback } from 'react'

function getWsUrl() {
  if ((import.meta as any).env?.VITE_WS_URL) {
    return (import.meta as any).env.VITE_WS_URL
  }
  const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost'
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${host}:8080/ws`
}

const WS_URL = getWsUrl()

export type WsStatus = 'connecting' | 'connected' | 'disconnected'

export interface WsMessage {
  type: string
  [key: string]: any
}

interface UseWebSocketOptions {
  onMessage?: (msg: WsMessage) => void
  reconnectDelayMs?: number
}

export function useWebSocket({ onMessage, reconnectDelayMs = 2000 }: UseWebSocketOptions = {}) {
  const [status, setStatus] = useState<WsStatus>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMounted = useRef(true)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    if (!isMounted.current) return
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return

    setStatus('connecting')

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      if (!isMounted.current) return
      setStatus('connected')
      // Clear any pending reconnect
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
      // Start heartbeat
      heartbeatTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, 25000)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsMessage
        if (msg.type === 'pong') return // ignore heartbeat reply
        onMessageRef.current?.(msg)
      } catch { /* ignore malformed */ }
    }

    ws.onerror = () => {
      ws.close()
    }

    ws.onclose = () => {
      if (!isMounted.current) return
      setStatus('disconnected')
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current)
        heartbeatTimer.current = null
      }
      // Reconnect with exponential-ish back-off (capped at 10s)
      const delay = Math.min(reconnectDelayMs * 2, 10000)
      reconnectTimer.current = setTimeout(() => {
        if (isMounted.current) connect()
      }, delay)
    }
  }, [reconnectDelayMs])

  useEffect(() => {
    isMounted.current = true
    connect()
    return () => {
      isMounted.current = false
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((msg: WsMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  return { status, send }
}
