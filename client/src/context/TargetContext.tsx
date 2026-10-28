import { createContext, useContext, useState, useCallback } from 'react'

interface TargetContextType {
  selectedTargetIds: string[]
  setSelectedTargetIds: (ids: string[]) => void
  isAll: boolean
}

const TargetContext = createContext<TargetContextType | undefined>(undefined)

const STORAGE_KEY = 'linkdesk_selected_targets'

export function TargetProvider({ children }: { children: React.ReactNode }) {
  const [selectedTargetIds, setTargetsState] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const setSelectedTargetIds = useCallback((ids: string[]) => {
    setTargetsState(ids)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      /* ignore */
    }
  }, [])

  const isAll = selectedTargetIds.length === 0

  return (
    <TargetContext.Provider value={{ selectedTargetIds, setSelectedTargetIds, isAll }}>
      {children}
    </TargetContext.Provider>
  )
}

export function useTarget() {
  const context = useContext(TargetContext)
  if (!context) throw new Error('useTarget must be used within TargetProvider')
  return context
}
