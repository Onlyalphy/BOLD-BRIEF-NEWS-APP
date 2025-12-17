export enum Region {
  KENYA = 'Kenya',
  EAST_AFRICA = 'East Africa',
  AFRICA = 'Africa',
  GLOBAL = 'Global'
}

export enum Category {
  GEOPOLITICS = 'Politics',
  BUSINESS = 'Business',
  AI = 'AI & Tech',
  CRYPTO = 'Stocks & Crypto',
  WAR = 'Wars & Conflict',
  HEALTH = 'Health',
  CLIMATE = 'Climate Change',
  ENTERTAINMENT = 'Entertainment'
}

export enum PipelineStage {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  RANKING = 'RANKING',
  VERIFYING = 'VERIFYING',
  GENERATING_ART = 'GENERATING_ART',
  PUBLISHING = 'PUBLISHING'
}

export interface Source {
  title: string;
  url: string;
}

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string; // The briefing content
  category: Category;
  region: Region;
  timestamp: number;
  sources: Source[];
  hashtags: string[];
  verificationScore: number; // 0-100
  tweetDraft: string;
  status: 'published' | 'developing';
  imageUrl?: string; // Base64 or URL for the AI generated image
  rankingScore?: number; // Global attention score
}

export interface ProcessingLog {
  id: string;
  message: string;
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'action';
}
