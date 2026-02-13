/**
 * Integration Services
 * 
 * This module provides interfaces and utilities for integrating with external platforms:
 * - Google Analytics: Real-time traffic and visitor data
 * - Fiverr: Gig management and order tracking
 * - Social Media: Facebook, Twitter, Instagram automation
 */

export interface IntegrationConfig {
  provider: 'google_analytics' | 'fiverr' | 'facebook' | 'twitter' | 'instagram';
  credentials: Record<string, string>;
  isActive: boolean;
}

export interface SyncResult {
  success: boolean;
  recordsSync: number;
  error?: string;
  lastSync: Date;
}

/**
 * Base integration interface
 */
export interface IIntegrationService {
  authenticate(credentials: Record<string, string>): Promise<boolean>;
  sync(userId: number, websiteId?: number): Promise<SyncResult>;
  disconnect(): Promise<void>;
}

import { GoogleAnalyticsService } from './google-analytics';
import { FiverrService } from './fiverr';
import { FacebookService, TwitterService, InstagramService } from './social-media';

/**
 * Integration service factory
 */
export function createIntegrationService(provider: string): IIntegrationService | null {
  switch (provider) {
    case 'google_analytics':
      return new GoogleAnalyticsService();
    case 'fiverr':
      return new FiverrService();
    case 'facebook':
      return new FacebookService();
    case 'twitter':
      return new TwitterService();
    case 'instagram':
      return new InstagramService();
    default:
      return null;
  }
}

// Real implementations are in separate files
