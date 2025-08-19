// types/Ad.ts
export interface Ad {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  finalVideoUrl?: string;
  finalVideoUrl4x5?: string;
  brandName?: string;
  productUrl?: string;
  format?: string;
  duration?: number;
  language?: string;
  isWatermarked?: boolean;
  enableDualFormat?: boolean;
  lipsyncedAvatarUrl?: string;
  lipsyncedAvatarNoBgUrl?: string;
  syncLabsJobId?: string;
  templateId?: string;
}
