// components/AdCreationContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

// The AdCreationData interface remains the same
export interface AdCreationData {
  productUrl?: string;
  summary?: string;
  brandName?: string;
  logoUrl?: string;
  description?: string;
  selectedImages?: string[];
  selectedVideos?: string[];
  showPromo?: boolean;
  originalPrice?: string;
  promoPrice?: string;
  promoDetails?: string;
  format?: string;
  duration?: number;
  language?: string;
  audience?: string;
  script?: string;
  scripts?: { [key: string]: string };
  avatarId?: number;
  templateId?: string;
  syncLabsJobId?: string; // It's good practice to add any potential fields
}

interface AdCreationContextType {
  adData: AdCreationData;
  setAdData: (data: Partial<AdCreationData>) => void;
  resetAdData: () => void;
}

const AdCreationContext = createContext<AdCreationContextType | undefined>(undefined);

const AD_DRAFT_STORAGE_KEY = 'ad-creation-draft';

export function AdCreationProvider({ children }: { children: ReactNode }) {
  const [adData, setAdDataState] = useState<AdCreationData>({});
  const [isClient, setIsClient] = useState(false);

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
    try {
      const item = window.localStorage.getItem(AD_DRAFT_STORAGE_KEY);
      if (item) {
        setAdDataState(JSON.parse(item));
      }
    } catch (error) {
      console.error("Failed to parse ad draft from local storage", error);
    }
  }, []);

  const setAdData = useCallback((data: Partial<AdCreationData>) => {
    const newAdData = { ...adData, ...data };
    setAdDataState(newAdData);
    
    // Every time data changes, save the full draft to local storage.
    if (isClient) {
      try {
        window.localStorage.setItem(AD_DRAFT_STORAGE_KEY, JSON.stringify(newAdData));
      } catch (error) {
        console.error("Failed to save ad draft to local storage", error);
      }
    }
  }, [adData, isClient]);

  const resetAdData = useCallback(() => {
    setAdDataState({});
    // Also clear the draft from local storage.
    if (isClient) {
      try {
        window.localStorage.removeItem(AD_DRAFT_STORAGE_KEY);
      } catch (error) {
        console.error("Failed to remove ad draft from local storage", error);
      }
    }
  }, [isClient]);

  return (
    <AdCreationContext.Provider value={{ adData, setAdData, resetAdData }}>
      {children}
    </AdCreationContext.Provider>
  );
}

export function useAdCreation() {
  const ctx = useContext(AdCreationContext);
  if (!ctx) throw new Error('useAdCreation must be used within AdCreationProvider');
  return ctx;
}