import { Router, Request, Response } from "express";
import {
  generateAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  revokeToken,
  type OAuthProvider,
} from "./oauth-service";
import * as db from "./db";

const router = Router();

/**
 * Initiate OAuth flow
 * GET /oauth/authorize/:provider
 */
router.get("/authorize/:provider", (req: Request, res: Response) => {
  const provider = req.params.provider as OAuthProvider;
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const { url, state } = generateAuthorizationUrl(provider);

    // Store state in session or database for verification
    // For now, we'll just return the URL
    res.json({ url, state, provider });
  } catch (error) {
    console.error("[OAuth] Failed to generate authorization URL:", error);
    res.status(500).json({ error: "Failed to generate authorization URL" });
  }
});

/**
 * OAuth callback handler
 * GET /oauth/callback/:provider
 */
router.get("/callback/:provider", async (req: Request, res: Response) => {
  const provider = req.params.provider as OAuthProvider;
  const code = req.query.code as string;
  const state = req.query.state as string;
  const userId = req.query.userId as string;

  if (!code || !state || !userId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // Exchange code for token
    const token = await exchangeCodeForToken(provider, code);

    // Store token in database
    const normalizedProvider = provider === "googleAnalytics" ? "google_analytics" : (provider as any);
    const integration = await db.getIntegrationByProvider(parseInt(userId), normalizedProvider as any);
    if (integration) {
      await db.updateIntegration(integration.id, {
        credentialData: {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          expiresAt: token.expiresAt,
        },
        isActive: true,
      });
    } else {
      await db.createIntegration({
        userId: parseInt(userId),
        provider: normalizedProvider as any,
        isActive: true,
        credentialData: {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          expiresAt: token.expiresAt,
        },
      });
    }

    // Redirect to success page or app
    res.redirect(`/integrations?provider=${provider}&success=true`);
  } catch (error) {
    console.error("[OAuth] Callback failed:", error);
    res.redirect(`/integrations?provider=${provider}&error=true`);
  }
});

/**
 * Disconnect integration
 * POST /oauth/disconnect/:provider
 */
router.post("/disconnect/:provider", async (req: Request, res: Response) => {
  const provider = req.params.provider as OAuthProvider;
  const userId = req.body.userId as number;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const integration = await db.getIntegrationByProvider(userId, provider);
    if (integration) {
      const credentials = integration.credentialData as any;
      if (credentials.accessToken) {
        await revokeToken(provider, credentials.accessToken);
      }

      await db.updateIntegration(integration.id, {
        isActive: false,
        credentialData: {},
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[OAuth] Disconnect failed:", error);
    res.status(500).json({ error: "Failed to disconnect" });
  }
});

/**
 * Refresh token
 * POST /oauth/refresh/:provider
 */
router.post("/refresh/:provider", async (req: Request, res: Response) => {
  const provider = req.params.provider as OAuthProvider;
  const userId = req.body.userId as number;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const integration = await db.getIntegrationByProvider(userId, provider);
    if (!integration) {
      return res.status(404).json({ error: "Integration not found" });
    }

    const credentials = integration.credentialData as any;
    if (!credentials.refreshToken) {
      return res.status(400).json({ error: "No refresh token available" });
    }

    const newToken = await refreshAccessToken(provider, credentials.refreshToken);

    await db.updateIntegration(integration.id, {
      credentialData: {
        accessToken: newToken.accessToken,
        refreshToken: newToken.refreshToken,
        expiresAt: newToken.expiresAt,
      },
    });

    res.json({ success: true, token: newToken });
  } catch (error) {
    console.error("[OAuth] Token refresh failed:", error);
    res.status(500).json({ error: "Failed to refresh token" });
  }
});

export default router;
