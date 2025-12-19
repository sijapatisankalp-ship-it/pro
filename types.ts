
export interface ProductAnalysis {
  productName: string;
  productType: string;
  materials: string[];
  primaryColors: string[];
  targetAudience: string;
}

export interface LoadingState {
  analyzing: boolean;
  generatingImage: boolean;
  writingScript: boolean;
  ideatingBRoll: boolean;
  generatingVideo: boolean;
}

export interface CreativeAssets {
  originalImage: string | null;
  lifestyleImage: string | null;
  tiktokScript: string | null;
  bRollConcepts: string[] | null;
  productVideoUrl: string | null;
}
