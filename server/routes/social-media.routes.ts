import express, { Request, Response } from 'express';
import { MetaGraphAPIService } from '@/server/services/meta-graph-api.service';
import { TikTokAPIService } from '@/server/services/tiktok-api.service';
import { InstagramAPIService } from '@/server/services/instagram-api.service';

const router = express.Router();

/**
 * POST /api/social-media/meta/auth
 * Validate Meta/Facebook access token
 */
router.post('/meta/auth', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const isValid = await MetaGraphAPIService.validateAccessToken(accessToken);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid access token' });
    }

    res.json({ success: true, message: 'Access token validated' });
  } catch (error) {
    console.error('[SocialMedia] Error validating Meta token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/social-media/meta/pages
 * Get user's Facebook pages
 */
router.get('/meta/pages', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const pages = await MetaGraphAPIService.getUserPages(accessToken as string);

    res.json({ success: true, pages });
  } catch (error) {
    console.error('[SocialMedia] Error fetching Meta pages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/social-media/meta/page/:pageId/insights
 * Get Facebook page insights
 */
router.get('/meta/page/:pageId/insights', async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const insights = await MetaGraphAPIService.getPageInsights(pageId, accessToken as string);

    res.json({ success: true, insights });
  } catch (error) {
    console.error('[SocialMedia] Error fetching page insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/social-media/meta/page/:pageId/posts
 * Get Facebook page posts
 */
router.get('/meta/page/:pageId/posts', async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;
    const { accessToken, limit } = req.query;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const posts = await MetaGraphAPIService.getPagePosts(
      pageId,
      accessToken as string,
      parseInt(limit as string) || 10
    );

    res.json({ success: true, posts });
  } catch (error) {
    console.error('[SocialMedia] Error fetching page posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/social-media/instagram/account/:pageId
 * Get Instagram business account
 */
router.get('/instagram/account/:pageId', async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const account = await MetaGraphAPIService.getInstagramBusinessAccount(pageId, accessToken as string);

    if (!account) {
      return res.status(404).json({ error: 'Instagram account not found' });
    }

    res.json({ success: true, account });
  } catch (error) {
    console.error('[SocialMedia] Error fetching Instagram account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/social-media/instagram/:accountId/insights
 * Get Instagram account insights
 */
router.get('/instagram/:accountId/insights', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const insights = await MetaGraphAPIService.getInstagramInsights(accountId, accessToken as string);

    res.json({ success: true, insights });
  } catch (error) {
    console.error('[SocialMedia] Error fetching Instagram insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/social-media/instagram/:accountId/media
 * Get Instagram media (posts)
 */
router.get('/instagram/:accountId/media', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { accessToken, limit } = req.query;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const media = await MetaGraphAPIService.getInstagramMedia(
      accountId,
      accessToken as string,
      parseInt(limit as string) || 10
    );

    res.json({ success: true, media });
  } catch (error) {
    console.error('[SocialMedia] Error fetching Instagram media:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/social-media/tiktok/auth
 * Validate TikTok access token
 */
router.post('/tiktok/auth', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const isValid = await TikTokAPIService.validateAccessToken(accessToken);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid access token' });
    }

    res.json({ success: true, message: 'Access token validated' });
  } catch (error) {
    console.error('[SocialMedia] Error validating TikTok token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/social-media/tiktok/user
 * Get TikTok user info
 */
router.get('/tiktok/user', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const user = await TikTokAPIService.getUserInfo(accessToken as string);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('[SocialMedia] Error fetching TikTok user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/social-media/tiktok/videos
 * Get TikTok user videos
 */
router.get('/tiktok/videos', async (req: Request, res: Response) => {
  try {
    const { accessToken, limit } = req.query;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const videos = await TikTokAPIService.getUserVideos(
      accessToken as string,
      parseInt(limit as string) || 10
    );

    res.json({ success: true, videos });
  } catch (error) {
    console.error('[SocialMedia] Error fetching TikTok videos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/social-media/tiktok/analytics
 * Get TikTok user analytics
 */
router.get('/tiktok/analytics', async (req: Request, res: Response) => {
  try {
    const { accessToken, startDate, endDate } = req.query;

    if (!accessToken || !startDate || !endDate) {
      return res.status(400).json({ error: 'Access token, startDate, and endDate required' });
    }

    const analytics = await TikTokAPIService.getUserAnalytics(
      accessToken as string,
      startDate as string,
      endDate as string
    );

    res.json({ success: true, analytics });
  } catch (error) {
    console.error('[SocialMedia] Error fetching TikTok analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/social-media/tiktok/auth-url
 * Get TikTok OAuth authorization URL
 */
router.get('/tiktok/auth-url', (req: Request, res: Response) => {
  try {
    const { redirectUri, state } = req.query;

    if (!redirectUri || !state) {
      return res.status(400).json({ error: 'redirectUri and state required' });
    }

    const authUrl = TikTokAPIService.getAuthorizationUrl(redirectUri as string, state as string);

    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('[SocialMedia] Error generating TikTok auth URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/social-media/tiktok/exchange-code
 * Exchange TikTok authorization code for access token
 */
router.post('/tiktok/exchange-code', async (req: Request, res: Response) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({ error: 'code and redirectUri required' });
    }

    const tokens = await TikTokAPIService.exchangeCodeForToken(code, redirectUri);

    if (!tokens) {
      return res.status(401).json({ error: 'Failed to exchange code for token' });
    }

    res.json({ success: true, tokens });
  } catch (error) {
    console.error('[SocialMedia] Error exchanging TikTok code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
