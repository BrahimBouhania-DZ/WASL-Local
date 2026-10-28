import { createContext, useContext, useState, useCallback } from 'react'

export type ActivityType = 'pairing' | 'file' | 'text' | 'clipboard' | 'device' | 'info'

export interface ActivityEntry {
  id: string
  type: ActivityType
  message: string
  detail?: string
  timestamp: number
}

interface ActivityContextType {
  entries: ActivityEntry[]
  log: (type: ActivityType, message: string, detail?: string) => void
  clear: () => void
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined)

let _idCounter = 0

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([])

  const log = useCallback((type: ActivityType, message: string, detail?: string) => {
    const entry: ActivityEntry = {
      id: `${Date.now()}-${_idCounter++}`,
      type,
      message,
      detail,
      timestamp: Date.now()
    }
    setEntries(prev => [entry, ...prev].slice(0, 200))
  }, [])

  const clear = useCallback(() => {
    setEntries([])
  }, [])

  return (
    <ActivityContext.Provider value={{ entries, log, clear }}>
      {children}
    </ActivityContext.Provider>
  )
}

export function useActivity() {
  const ctx = useContext(ActivityContext)
  if (!ctx) throw new Error('useActivity must be used within ActivityProvider')
  return ctx
}
