/**
 * Meta/Facebook Graph API Service
 * Handles authentication and data fetching from Meta Graph API
 */

interface GraphAPIResponse<T> {
  data?: T;
  error?: {
    message: string;
    code: number;
  };
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  picture?: {
    data: {
      height: number;
      width: number;
      is_silhouette: boolean;
      url: string;
    };
  };
}

interface FacebookInsights {
  name: string;
  period: string;
  values: Array<{
    value: number;
    end_time?: string;
  }>;
  title: string;
  description: string;
  id: string;
}

interface InstagramBusinessAccount {
  id: string;
  username: string;
  name: string;
  biography?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  ig_id?: number;
  website?: string;
}

export class MetaGraphAPIService {
  private static baseUrl = 'https://graph.facebook.com/v19.0';
  private static appId = process.env.META_APP_ID;
  private static appSecret = process.env.META_APP_SECRET;

  /**
   * Get user's Facebook pages
   */
  static async getUserPages(accessToken: string): Promise<FacebookPage[]> {
    try {
      const url = `${this.baseUrl}/me/accounts?access_token=${accessToken}&fields=id,name,access_token,category,picture`;
      const response = await fetch(url);
      const data: GraphAPIResponse<FacebookPage[]> = await response.json();

      if (data.error) {
        console.error('[MetaGraphAPI] Error fetching pages:', data.error.message);
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error('[MetaGraphAPI] Error getting user pages:', error);
      return [];
    }
  }

  /**
   * Get page insights (metrics)
   */
  static async getPageInsights(
    pageId: string,
    accessToken: string,
    metrics: string[] = ['page_fans', 'page_engaged_users', 'page_post_engagements']
  ): Promise<FacebookInsights[]> {
    try {
      const metricsParam = metrics.join(',');
      const url = `${this.baseUrl}/${pageId}/insights?metrics=${metricsParam}&access_token=${accessToken}&period=day`;
      const response = await fetch(url);
      const data: GraphAPIResponse<FacebookInsights[]> = await response.json();

      if (data.error) {
        console.error('[MetaGraphAPI] Error fetching insights:', data.error.message);
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error('[MetaGraphAPI] Error getting page insights:', error);
      return [];
    }
  }

  /**
   * Get page posts
   */
  static async getPagePosts(pageId: string, accessToken: string, limit: number = 10) {
    try {
      const url = `${this.baseUrl}/${pageId}/posts?access_token=${accessToken}&fields=id,message,created_time,type,story,permalink_url,shares,likes.summary(total_count).limit(0),comments.summary(total_count).limit(0)&limit=${limit}`;
      const response = await fetch(url);
      const data: GraphAPIResponse<any[]> = await response.json();

      if (data.error) {
        console.error('[MetaGraphAPI] Error fetching posts:', data.error.message);
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error('[MetaGraphAPI] Error getting page posts:', error);
      return [];
    }
  }

  /**
   * Get Instagram Business Account connected to Facebook Page
   */
  static async getInstagramBusinessAccount(pageId: string, accessToken: string): Promise<InstagramBusinessAccount | null> {
    try {
      const url = `${this.baseUrl}/${pageId}?access_token=${accessToken}&fields=instagram_business_account`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.error) {
        console.error('[MetaGraphAPI] Error fetching Instagram account:', data.error.message);
        return null;
      }

      if (data.instagram_business_account) {
        return await this.getInstagramAccountDetails(data.instagram_business_account.id, accessToken);
      }

      return null;
    } catch (error) {
      console.error('[MetaGraphAPI] Error getting Instagram business account:', error);
      return null;
    }
  }

  /**
   * Get Instagram account details
   */
  static async getInstagramAccountDetails(accountId: string, accessToken: string): Promise<InstagramBusinessAccount | null> {
    try {
      const url = `${this.baseUrl}/${accountId}?access_token=${accessToken}&fields=id,username,name,biography,profile_picture_url,followers_count,follows_count,ig_id,website`;
      const response = await fetch(url);
      const data: GraphAPIResponse<InstagramBusinessAccount> = await response.json();

      if (data.error) {
        console.error('[MetaGraphAPI] Error fetching Instagram details:', data.error.message);
        return null;
      }

      return data.data || null;
    } catch (error) {
      console.error('[MetaGraphAPI] Error getting Instagram account details:', error);
      return null;
    }
  }

  /**
   * Get Instagram insights
   */
  static async getInstagramInsights(
    accountId: string,
    accessToken: string,
    metrics: string[] = ['impressions', 'reach', 'profile_views']
  ) {
    try {
      const metricsParam = metrics.join(',');
      const url = `${this.baseUrl}/${accountId}/insights?metric=${metricsParam}&access_token=${accessToken}&period=day`;
      const response = await fetch(url);
      const data: GraphAPIResponse<FacebookInsights[]> = await response.json();

      if (data.error) {
        console.error('[MetaGraphAPI] Error fetching Instagram insights:', data.error.message);
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error('[MetaGraphAPI] Error getting Instagram insights:', error);
      return [];
    }
  }

  /**
   * Get Instagram media (posts)
   */
  static async getInstagramMedia(accountId: string, accessToken: string, limit: number = 10) {
    try {
      const url = `${this.baseUrl}/${accountId}/media?access_token=${accessToken}&fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=${limit}`;
      const response = await fetch(url);
      const data: GraphAPIResponse<any[]> = await response.json();

      if (data.error) {
        console.error('[MetaGraphAPI] Error fetching Instagram media:', data.error.message);
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error('[MetaGraphAPI] Error getting Instagram media:', error);
      return [];
    }
  }

  /**
   * Get Facebook Ads campaigns
   */
  static async getAdCampaigns(accountId: string, accessToken: string) {
    try {
      const url = `${this.baseUrl}/${accountId}/campaigns?access_token=${accessToken}&fields=id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time`;
      const response = await fetch(url);
      const data: GraphAPIResponse<any[]> = await response.json();

      if (data.error) {
        console.error('[MetaGraphAPI] Error fetching ad campaigns:', data.error.message);
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error('[MetaGraphAPI] Error getting ad campaigns:', error);
      return [];
    }
  }

  /**
   * Get ad campaign insights
   */
  static async getCampaignInsights(campaignId: string, accessToken: string) {
    try {
      const url = `${this.baseUrl}/${campaignId}/insights?access_token=${accessToken}&fields=impressions,clicks,spend,ctr,cpc,cpm,actions,action_values`;
      const response = await fetch(url);
      const data: GraphAPIResponse<any[]> = await response.json();

      if (data.error) {
        console.error('[MetaGraphAPI] Error fetching campaign insights:', data.error.message);
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error('[MetaGraphAPI] Error getting campaign insights:', error);
      return [];
    }
  }

  /**
   * Validate access token
   */
  static async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/me?access_token=${accessToken}`;
      const response = await fetch(url);
      const data: any = await response.json();

      return !data.error;
    } catch (error) {
      console.error('[MetaGraphAPI] Error validating token:', error);
      return false;
    }
  }

  /**
   * Refresh access token (long-lived token)
   */
  static async refreshAccessToken(shortLivedToken: string): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.appId}&client_secret=${this.appSecret}&fb_exchange_token=${shortLivedToken}`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.error) {
        console.error('[MetaGraphAPI] Error refreshing token:', data.error.message);
        return null;
      }

      return data.access_token || null;
    } catch (error) {
      console.error('[MetaGraphAPI] Error refreshing access token:', error);
      return null;
    }
  }
}
