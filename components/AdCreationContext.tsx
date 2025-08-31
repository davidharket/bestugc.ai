// components/AdCreationContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { WeightedScene } from '../lib/templates';

// The AdCreationData interface remains the same
export interface OrderedAsset {
  url: string;
  order: number;
}

export interface ProductVideoData {
  includeProductVideo: boolean;
  selectedImageId?: string;
  productDescription?: string;
  productImages?: string[];
  generatedImages?: Array<{id: string, url: string, taskId: string, status?: string}>;
  avatarId?: number;
  attemptsRemaining?: number;
}

export interface AdCreationData {
  productUrl?: string;
  summary?: string;
  brandName?: string;
  logoUrl?: string;
  description?: string;
  selectedImages?: string[];
  selectedVideos?: string[];
  selectedBRoll?: string[];
  orderedImages?: OrderedAsset[];
  orderedVideos?: OrderedAsset[];
  orderedBRoll?: OrderedAsset[];
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
  selectedScript?: string;
  avatarId?: number;
  templateId?: string;
  modifiedTimeline?: WeightedScene[]; // User's custom timeline
  syncLabsJobId?: string; // It's good practice to add any potential fields
  subtitleStyle?: string;
  subtitleAnimation?: 'fade' | 'slide' | 'typewriter' | 'bounce' | 'none';
  subtitlePosition?: 'bottom' | 'top' | 'center';
  enableSubtitles?: boolean;
  useCapsLock?: boolean;
  oneWordAtATime?: boolean;
  fontSize?: number;
  audioUrl?: string;
  audioDuration?: number;
  wordTimings?: Array<{ word: string; startTime: number; endTime: number; }>;
  backgroundMusicUrl?: string;
  backgroundMusicVolume?: number;
  // Dual format support
  enableDualFormat?: boolean;
  currentPreviewFormat?: '9:16' | '4:5';
  // Avatar Product Video
  productVideoUrl?: string;
  productVideoData?: ProductVideoData;
  // Advanced font customization
  fontWeight?: number;
  outlineWidth?: number;
  outlineColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowColor?: string;
  enableShadow?: boolean;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textColor?: string;
  customFontFamily?: string;
  customFontUrl?: string;
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
    setAdDataState(prevAdData => {
      const newAdData = { ...prevAdData, ...data };
      
      // Save to local storage whenever data changes
      if (isClient) {
        try {
          window.localStorage.setItem(AD_DRAFT_STORAGE_KEY, JSON.stringify(newAdData));
        } catch (error) {
          console.error("Failed to save ad draft to local storage", error);
        }
      }
      
      return newAdData;
    });
  }, [isClient]);

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
