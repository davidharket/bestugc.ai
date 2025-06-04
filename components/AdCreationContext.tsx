import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface AdCreationData {
  productUrl?: string
  summary?: string
  brandName?: string
  logoUrl?: string
  description?: string
  selectedImages?: string[]
  selectedVideos?: string[]
  showPromo?: boolean
  originalPrice?: string
  promoPrice?: string
  promoDetails?: string
  format?: string
  duration?: number
  language?: string
  audience?: string
  script?: string
  avatarId?: number
  templateId?: number
}

interface AdCreationContextType {
  adData: AdCreationData
  setAdData: (data: Partial<AdCreationData>) => void
  resetAdData: () => void
}

const AdCreationContext = createContext<AdCreationContextType | undefined>(undefined)

export function AdCreationProvider({ children }: { children: ReactNode }) {
  const [adData, setAdDataState] = useState<AdCreationData>({})

  const setAdData = (data: Partial<AdCreationData>) => {
    setAdDataState(prev => ({ ...prev, ...data }))
  }

  const resetAdData = () => setAdDataState({})

  return (
    <AdCreationContext.Provider value={{ adData, setAdData, resetAdData }}>
      {children}
    </AdCreationContext.Provider>
  )
}

export function useAdCreation() {
  const ctx = useContext(AdCreationContext)
  if (!ctx) throw new Error('useAdCreation must be used within AdCreationProvider')
  return ctx
} 