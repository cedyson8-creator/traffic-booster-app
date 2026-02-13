import axios from "axios";
import { oauthConfig } from "./oauth-config";
import type { OAuthProvider } from "./oauth-config";

export type { OAuthProvider };

/**
 * OAuth Service
 * Handles OAuth 2.0 flows for all integrations
 */

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: number;
  tokenType?: string;
}

export interface OAuthState {
  provider: OAuthProvider;
  state: string;
  codeVerifier?: string;
  timestamp: number;
}

/**
 * Generate OAuth authorization URL
 */
export function generateAuthorizationUrl(provider: OAuthProvider): { url: string; state: string } {
  const config = oauthConfig[provider] as any;
  const state = generateRandomString(32);
  const scope = (config.scope as string[])?.join(" ") || "";

  const params = new URLSearchParams({
    client_id: config.clientId || config.appId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    state,
    scope,
  });

  let url = "";
  switch (provider) {
    case "googleAnalytics":
      url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
      break;
    case "facebook":
      url = `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
      break;
    case "twitter":
      url = `https://twitter.com/i/oauth2/authorize?${params}`;
      break;
    case "instagram":
      url = `https://api.instagram.com/oauth/authorize?${params}`;
      break;
    case "fiverr":
      url = `https://www.fiverr.com/oauth2/authorize?${params}`;
      break;
  }

  return { url, state };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string
): Promise<OAuthToken> {
  const config = oauthConfig[provider] as any;

  try {
    let tokenUrl = "";
    let data: Record<string, string> = {
      client_id: config.clientId || config.appId,
      client_secret: config.clientSecret || config.appSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    };

    switch (provider) {
      case "googleAnalytics":
        tokenUrl = "https://oauth2.googleapis.com/token";
        break;
      case "facebook":
        tokenUrl = "https://graph.facebook.com/v18.0/oauth/access_token";
        break;
      case "twitter":
        tokenUrl = "https://twitter.com/2/oauth2/token";
        data.code_verifier = data.code; // Twitter requires PKCE
        break;
      case "instagram":
        tokenUrl = "https://graph.instagram.com/v18.0/oauth/access_token";
        break;
      case "fiverr":
        tokenUrl = "https://api.fiverr.com/oauth2/token";
        break;
    }

    const response = await axios.post(tokenUrl, data, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const expiresIn = response.data.expires_in || 3600;
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn,
      expiresAt: Date.now() + expiresIn * 1000,
      tokenType: response.data.token_type || "Bearer",
    };
  } catch (error) {
    console.error(`[OAuth] Failed to exchange code for ${provider}:`, error);
    throw new Error(`Failed to authenticate with ${provider}`);
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  provider: OAuthProvider,
  refreshToken: string
): Promise<OAuthToken> {
  const config = oauthConfig[provider] as any;

  try {
    let tokenUrl = "";
    let data: Record<string, string> = {
      client_id: config.clientId || config.appId,
      client_secret: config.clientSecret || config.appSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    };

    switch (provider) {
      case "googleAnalytics":
        tokenUrl = "https://oauth2.googleapis.com/token";
        break;
      case "facebook":
        tokenUrl = "https://graph.facebook.com/v18.0/oauth/access_token";
        break;
      case "twitter":
        tokenUrl = "https://twitter.com/2/oauth2/token";
        break;
      case "instagram":
        tokenUrl = "https://graph.instagram.com/v18.0/oauth/refresh_access_token";
        break;
      case "fiverr":
        tokenUrl = "https://api.fiverr.com/oauth2/token";
        break;
    }

    const response = await axios.post(tokenUrl, data, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const expiresIn = response.data.expires_in || 3600;
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || refreshToken,
      expiresIn,
      expiresAt: Date.now() + expiresIn * 1000,
      tokenType: response.data.token_type || "Bearer",
    };
  } catch (error) {
    console.error(`[OAuth] Failed to refresh token for ${provider}:`, error);
    throw new Error(`Failed to refresh token for ${provider}`);
  }
}

/**
 * Revoke access token
 */
export async function revokeToken(provider: OAuthProvider, accessToken: string): Promise<void> {
  try {
    let revokeUrl = "";

    switch (provider) {
      case "googleAnalytics":
        revokeUrl = `https://oauth2.googleapis.com/revoke?token=${accessToken}`;
        await axios.post(revokeUrl);
        break;
      case "facebook":
        revokeUrl = `https://graph.facebook.com/me/permissions?access_token=${accessToken}`;
        await axios.delete(revokeUrl);
        break;
      case "twitter":
        revokeUrl = "https://twitter.com/2/oauth2/revoke";
        await axios.post(revokeUrl, { token: accessToken });
        break;
      case "instagram":
        revokeUrl = `https://graph.instagram.com/me/permissions?access_token=${accessToken}`;
        await axios.delete(revokeUrl);
        break;
      case "fiverr":
        revokeUrl = "https://api.fiverr.com/oauth2/revoke";
        await axios.post(revokeUrl, { token: accessToken });
        break;
    }
  } catch (error) {
    console.warn(`[OAuth] Failed to revoke token for ${provider}:`, error);
  }
}

/**
 * Generate random string for state parameter
 */
function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
