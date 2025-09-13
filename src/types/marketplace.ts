/**
 * Marketplace Types - V2 Feature Marketplace
 * 
 * Types for the marketplace system
 */

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  category: 'adapter-feature' | 'cross-adapter-feature' | 'premium' | 'integration';
  author: string;
  version: string;
  downloads: number;
  rating: number;
  price: 'free' | string; // 'free' or price in USD
  tags: string[];
  compatibility: string[];
  features: string[];
  documentation?: string;
  repository?: string;
  license?: string;
  lastUpdated: string;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  description: string;
  count: number;
}

export interface MarketplaceSearchResult {
  items: MarketplaceItem[];
  total: number;
  query: string;
  category?: string | undefined;
}

export interface MarketplaceInstallOptions {
  version?: string;
  force?: boolean;
  dryRun?: boolean;
}

export interface MarketplacePublishOptions {
  public?: boolean;
  category?: string;
  tags?: string[];
  description?: string;
}
