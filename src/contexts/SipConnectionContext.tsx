import { createContext, useContext, ReactNode } from 'react'
import { useSipConnection as useBaseSipConnection } from '@/hooks/api/useSipConnection'
import type { SipConnectionStatus } from '@/hooks/api/useSipConnection'

interface SipConnectionContextValue {
  status: SipConnectionStatus
  connect: () => void
  disconnect: () => void
  isConnected: boolean
  isRegistered: boolean
  error: string | null
}

const SipConnectionContext = createContext<SipConnectionContextValue | null>(
  null,
)

export function SipConnectionProvider({ children }: { children: ReactNode }) {
  const sipConnection = useBaseSipConnection()

  return (
    <SipConnectionContext.Provider value={sipConnection}>
      {children}
    </SipConnectionContext.Provider>
  )
}

export function useSipConnection() {
  const context = useContext(SipConnectionContext)
  if (!context) {
    throw new Error(
      'useSipConnection must be used within SipConnectionProvider',
    )
  }
  return context
}
