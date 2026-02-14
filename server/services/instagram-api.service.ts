/**
 * Instagram Business API Service
 * Handles authentication and data fetching from Instagram Graph API
 * Note: Instagram is part of Meta's Graph API, so it uses the same base service
 */

interface InstagramMediaInsights {
  impressions: number;
  reach: number;
  engagement: number;
  saved: number;
  video_views?: number;
}

interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  media_url: string;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
}

interface InstagramStory {
  id: string;
  media_type: string;
  timestamp: string;
  insights?: {
    exits: number;
    impressions: number;
    reach: number;
    replies: number;
    taps_back: number;
    taps_forward: number;
  };
}

interface InstagramHashtagInsights {
  hashtag_id: string;
  name: string;
  recent_media_count: number;
}

export class InstagramAPIService {
  private static baseUrl = 'https://graph.instagram.com/v19.0';

  /**
   * Get Instagram Business Account info
   */
  static async getAccountInfo(accountId: string, accessToken: string) {
    try {
      const url = `${this.baseUrl}/${accountId}?access_token=${accessToken}&fields=id,username,name,biography,profile_picture_url,followers_count,follows_count,ig_id,website`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.error) {
        console.error('[InstagramAPI] Error fetching account info:', data.error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[InstagramAPI] Error getting account info:', error);
      return null;
    }
  }

  /**
   * Get Instagram media (posts)
   */
  static async getMedia(accountId: string, accessToken: string, limit: number = 10): Promise<InstagramMedia[]> {
    try {
      const url = `${this.baseUrl}/${accountId}/media?access_token=${accessToken}&fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=${limit}`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.error) {
        console.error('[InstagramAPI] Error fetching media:', data.error.message);
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error('[InstagramAPI] Error getting media:', error);
      return [];
    }
  }

  /**
   * Get media insights
   */
  static async getMediaInsights(mediaId: string, accessToken: string): Promise<InstagramMediaInsights | null> {
    try {
      const url = `${this.baseUrl}/${mediaId}/insights?access_token=${accessToken}&metric=impressions,reach,engagement,saved,video_views`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.error) {
        console.error('[InstagramAPI] Error fetching media insights:', data.error.message);
        return null;
      }

      const insights: InstagramMediaInsights = {
        impressions: 0,
        reach: 0,
        engagement: 0,
        saved: 0,
      };

      if (data.data) {
        data.data.forEach((metric: any) => {
          if (metric.name === 'impressions') insights.impressions = metric.values[0]?.value || 0;
          if (metric.name === 'reach') insights.reach = metric.values[0]?.value || 0;
          if (metric.name === 'engagement') insights.engagement = metric.values[0]?.value || 0;
          if (metric.name === 'saved') insights.saved = metric.values[0]?.value || 0;
          if (metric.name === 'video_views') insights.video_views = metric.values[0]?.value || 0;
        });
      }

      return insights;
    } catch (error) {
      console.error('[InstagramAPI] Error getting media insights:', error);
      return null;
    }
  }

  /**
   * Get account insights
   */
  static async getAccountInsights(accountId: string, accessToken: string) {
    try {
      const url = `${this.baseUrl}/${accountId}/insights?access_token=${accessToken}&metric=impressions,reach,profile_views,follower_count,email_contacts,phone_call_clicks,text_message_clicks,get_directions_clicks,website_clicks`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.error) {
        console.error('[InstagramAPI] Error fetching account insights:', data.error.message);
        return null;
      }

      const insights: any = {};

      if (data.data) {
        data.data.forEach((metric: any) => {
          insights[metric.name] = metric.values[0]?.value || 0;
        });
      }

      return insights;
    } catch (error) {
      console.error('[InstagramAPI] Error getting account insights:', error);
      return null;
    }
  }

  /**
   * Get stories
   */
  static async getStories(accountId: string, accessToken: string): Promise<InstagramStory[]> {
    try {
      const url = `${this.baseUrl}/${accountId}/stories?access_token=${accessToken}&fields=id,media_type,timestamp`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.error) {
        console.error('[InstagramAPI] Error fetching stories:', data.error.message);
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error('[InstagramAPI] Error getting stories:', error);
      return [];
    }
  }

  /**
   * Get story insights
   */
  static async getStoryInsights(storyId: string, accessToken: string) {
    try {
      const url = `${this.baseUrl}/${storyId}/insights?access_token=${accessToken}&metric=exits,impressions,reach,replies,taps_back,taps_forward`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.error) {
        console.error('[InstagramAPI] Error fetching story insights:', data.error.message);
        return null;
      }

      const insights: any = {};

      if (data.data) {
        data.data.forEach((metric: any) => {
          insights[metric.name] = metric.values[0]?.value || 0;
        });
      }

      return insights;
    } catch (error) {
      console.error('[InstagramAPI] Error getting story insights:', error);
      return null;
    }
  }

  /**
   * Get hashtag search
   */
  static async searchHashtag(hashtag: string, accessToken: string): Promise<InstagramHashtagInsights | null> {
    try {
      const url = `https://graph.instagram.com/ig_hashtag_search?user_id=YOUR_USER_ID&fields=id,name&access_token=${accessToken}&search_string=${hashtag}`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.error) {
        console.error('[InstagramAPI] Error searching hashtag:', data.error.message);
        return null;
      }

      return data.data?.[0] || null;
    } catch (error) {
      console.error('[InstagramAPI] Error searching hashtag:', error);
      return null;
    }
  }

  /**
   * Get hashtag insights
   */
  static async getHashtagInsights(hashtagId: string, accessToken: string) {
    try {
      const url = `${this.baseUrl}/${hashtagId}/insights?access_token=${accessToken}&metric=potential_reach,recent_media_count`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.error) {
        console.error('[InstagramAPI] Error fetching hashtag insights:', data.error.message);
        return null;
      }

      const insights: any = {};

      if (data.data) {
        data.data.forEach((metric: any) => {
          insights[metric.name] = metric.values[0]?.value || 0;
        });
      }

      return insights;
    } catch (error) {
      console.error('[InstagramAPI] Error getting hashtag insights:', error);
      return null;
    }
  }

  /**
   * Get comments on media
   */
  static async getMediaComments(mediaId: string, accessToken: string, limit: number = 10) {
    try {
      const url = `${this.baseUrl}/${mediaId}/comments?access_token=${accessToken}&fields=id,text,timestamp,from&limit=${limit}`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.error) {
        console.error('[InstagramAPI] Error fetching comments:', data.error.message);
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error('[InstagramAPI] Error getting comments:', error);
      return [];
    }
  }

  /**
   * Get followers
   */
  static async getFollowers(accountId: string, accessToken: string, limit: number = 10) {
    try {
      const url = `${this.baseUrl}/${accountId}/followers?access_token=${accessToken}&fields=id,username&limit=${limit}`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.error) {
        console.error('[InstagramAPI] Error fetching followers:', data.error.message);
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error('[InstagramAPI] Error getting followers:', error);
      return [];
    }
  }

  /**
   * Validate access token
   */
  static async validateAccessToken(accessToken: string, accountId: string): Promise<boolean> {
    try {
      const info = await this.getAccountInfo(accountId, accessToken);
      return info !== null;
    } catch (error) {
      console.error('[InstagramAPI] Error validating token:', error);
      return false;
    }
  }
}
