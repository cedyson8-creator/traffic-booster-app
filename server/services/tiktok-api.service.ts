/**
 * TikTok Business API Service
 * Handles authentication and data fetching from TikTok Business API
 */

interface TikTokAPIResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

interface TikTokUser {
  open_id: string;
  union_id?: string;
  display_name?: string;
  avatar_url?: string;
}

interface TikTokVideo {
  video_id: string;
  title: string;
  description: string;
  create_time: number;
  duration: number;
  cover_image_url?: string;
  share_url?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
}

interface TikTokVideoInsights {
  video_id: string;
  stat_type: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  profile_views?: number;
  follower_count?: number;
}

export class TikTokAPIService {
  private static baseUrl = 'https://open.tiktokapis.com/v1';
  private static clientKey = process.env.TIKTOK_CLIENT_KEY;
  private static clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  /**
   * Get TikTok user info
   */
  static async getUserInfo(accessToken: string): Promise<TikTokUser | null> {
    try {
      const url = `${this.baseUrl}/user/info`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data: TikTokAPIResponse<TikTokUser> = await response.json();

      if (data.error) {
        console.error('[TikTokAPI] Error fetching user info:', data.error.message);
        return null;
      }

      return data.data || null;
    } catch (error) {
      console.error('[TikTokAPI] Error getting user info:', error);
      return null;
    }
  }

  /**
   * Get TikTok videos
   */
  static async getUserVideos(accessToken: string, limit: number = 10): Promise<TikTokVideo[]> {
    try {
      const url = `${this.baseUrl}/video/list?max_count=${limit}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data: TikTokAPIResponse<{ videos: TikTokVideo[] }> = await response.json();

      if (data.error) {
        console.error('[TikTokAPI] Error fetching videos:', data.error.message);
        return [];
      }

      return data.data?.videos || [];
    } catch (error) {
      console.error('[TikTokAPI] Error getting user videos:', error);
      return [];
    }
  }

  /**
   * Get video insights
   */
  static async getVideoInsights(accessToken: string, videoId: string): Promise<TikTokVideoInsights | null> {
    try {
      const url = `${this.baseUrl}/video/query`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: {
            video_ids: [videoId],
          },
          metrics: ['views', 'likes', 'comments', 'shares'],
        }),
      });

      const data: TikTokAPIResponse<TikTokVideoInsights> = await response.json();

      if (data.error) {
        console.error('[TikTokAPI] Error fetching video insights:', data.error.message);
        return null;
      }

      return data.data || null;
    } catch (error) {
      console.error('[TikTokAPI] Error getting video insights:', error);
      return null;
    }
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(accessToken: string, startDate: string, endDate: string) {
    try {
      const url = `${this.baseUrl}/analytics/user`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data_level: 'BASIC',
          metrics: [
            'profile_views',
            'follower_count',
            'video_views',
            'engagement_rate',
          ],
          start_date: startDate,
          end_date: endDate,
        }),
      });

      const data: TikTokAPIResponse<any> = await response.json();

      if (data.error) {
        console.error('[TikTokAPI] Error fetching user analytics:', data.error.message);
        return null;
      }

      return data.data || null;
    } catch (error) {
      console.error('[TikTokAPI] Error getting user analytics:', error);
      return null;
    }
  }

  /**
   * Get video analytics
   */
  static async getVideoAnalytics(accessToken: string, videoId: string) {
    try {
      const url = `${this.baseUrl}/analytics/video`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_id: videoId,
          metrics: ['views', 'likes', 'comments', 'shares', 'watch_time'],
        }),
      });

      const data: TikTokAPIResponse<any> = await response.json();

      if (data.error) {
        console.error('[TikTokAPI] Error fetching video analytics:', data.error.message);
        return null;
      }

      return data.data || null;
    } catch (error) {
      console.error('[TikTokAPI] Error getting video analytics:', error);
      return null;
    }
  }

  /**
   * Validate access token
   */
  static async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const user = await this.getUserInfo(accessToken);
      return user !== null;
    } catch (error) {
      console.error('[TikTokAPI] Error validating token:', error);
      return false;
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/oauth/token`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientKey,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      const data: any = await response.json();

      if (data.error) {
        console.error('[TikTokAPI] Error refreshing token:', data.error.message);
        return null;
      }

      return data.access_token || null;
    } catch (error) {
      console.error('[TikTokAPI] Error refreshing access token:', error);
      return null;
    }
  }

  /**
   * Get authorization URL for OAuth flow
   */
  static getAuthorizationUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_key: this.clientKey || '',
      response_type: 'code',
      scope: 'user.info.basic,video.list,analytics.basic',
      redirect_uri: redirectUri,
      state,
    });

    return `https://www.tiktok.com/v2/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const url = `${this.baseUrl}/oauth/token`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientKey,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const data: any = await response.json();

      if (data.error) {
        console.error('[TikTokAPI] Error exchanging code:', data.error.message);
        return null;
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      };
    } catch (error) {
      console.error('[TikTokAPI] Error exchanging authorization code:', error);
      return null;
    }
  }
}
