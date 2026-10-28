import { createContext, useContext, useCallback, useRef } from 'react'
import { useWebSocket, WsMessage, WsStatus } from '../hooks/useWebSocket'

interface WsContextType {
  status: WsStatus
  send: (msg: WsMessage) => void
  subscribe: (handler: (msg: WsMessage) => void) => () => void
}

const WsContext = createContext<WsContextType | undefined>(undefined)

export function WsProvider({ children }: { children: React.ReactNode }) {
  const handlersRef = useRef<Set<(msg: WsMessage) => void>>(new Set())

  const onMessage = useCallback((msg: WsMessage) => {
    handlersRef.current.forEach(h => h(msg))
  }, [])

  const { status, send } = useWebSocket({ onMessage })

  const subscribe = useCallback((handler: (msg: WsMessage) => void) => {
    handlersRef.current.add(handler)
    return () => handlersRef.current.delete(handler)
  }, [])

  return (
    <WsContext.Provider value={{ status, send, subscribe }}>
      {children}
    </WsContext.Provider>
  )
}

export function useWs() {
  const ctx = useContext(WsContext)
  if (!ctx) throw new Error('useWs must be used within WsProvider')
  return ctx
}
