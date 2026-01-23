import { create } from 'zustand'
import { ReactNode } from 'react'

interface HeaderStore {
  customContent: ReactNode | null
  setCustomContent: (content: ReactNode | null) => void
  resetCustomContent: () => void
}

export const useHeaderStore = create<HeaderStore>((set) => ({
  customContent: null,
  setCustomContent: (content) => set({ customContent: content }),
  resetCustomContent: () => set({ customContent: null }),
}))
