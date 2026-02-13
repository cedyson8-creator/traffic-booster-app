/**
 * OAuth Configuration for all integrations
 * Replace placeholder values with real credentials from each platform
 */

export const oauthConfig = {
  googleAnalytics: {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "YOUR_GOOGLE_CLIENT_SECRET",
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || "https://your-app.com/oauth/callback/google",
    scope: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/analytics",
    ],
  },

  facebook: {
    appId: process.env.FACEBOOK_APP_ID || "YOUR_FACEBOOK_APP_ID",
    appSecret: process.env.FACEBOOK_APP_SECRET || "YOUR_FACEBOOK_APP_SECRET",
    redirectUri: process.env.FACEBOOK_OAUTH_REDIRECT_URI || "https://your-app.com/oauth/callback/facebook",
    scope: ["pages_read_engagement", "pages_read_user_content", "pages_manage_posts"],
  },

  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID || "YOUR_TWITTER_CLIENT_ID",
    clientSecret: process.env.TWITTER_CLIENT_SECRET || "YOUR_TWITTER_CLIENT_SECRET",
    redirectUri: process.env.TWITTER_OAUTH_REDIRECT_URI || "https://your-app.com/oauth/callback/twitter",
    scope: ["tweet.read", "users.read", "tweet.moderate.write"],
  },

  instagram: {
    appId: process.env.INSTAGRAM_APP_ID || "YOUR_INSTAGRAM_APP_ID",
    appSecret: process.env.INSTAGRAM_APP_SECRET || "YOUR_INSTAGRAM_APP_SECRET",
    redirectUri: process.env.INSTAGRAM_OAUTH_REDIRECT_URI || "https://your-app.com/oauth/callback/instagram",
    scope: ["instagram_basic", "instagram_graph_user_media"],
  },

  fiverr: {
    clientId: process.env.FIVERR_CLIENT_ID || "YOUR_FIVERR_CLIENT_ID",
    clientSecret: process.env.FIVERR_CLIENT_SECRET || "YOUR_FIVERR_CLIENT_SECRET",
    redirectUri: process.env.FIVERR_OAUTH_REDIRECT_URI || "https://your-app.com/oauth/callback/fiverr",
    apiKey: process.env.FIVERR_API_KEY || "YOUR_FIVERR_API_KEY",
  },
};

export type OAuthProvider = keyof typeof oauthConfig;
