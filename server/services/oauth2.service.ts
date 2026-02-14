import crypto from 'crypto';

/**
 * OAuth2 Service
 * Implements OAuth2 authorization server for third-party app access
 */

export interface OAuth2Client {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  scopes: string[];
  createdAt: Date;
  isActive: boolean;
}

export interface OAuth2AuthorizationCode {
  code: string;
  clientId: string;
  userId: number;
  scopes: string[];
  redirectUri: string;
  expiresAt: Date;
  used: boolean;
}

export interface OAuth2Token {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
}

export interface OAuth2Scope {
  name: string;
  description: string;
  category: 'read' | 'write' | 'admin';
}

/**
 * Available OAuth2 scopes
 */
export const OAUTH2_SCOPES: Record<string, OAuth2Scope> = {
  'api:read': {
    name: 'Read API Keys',
    description: 'View API keys and usage statistics',
    category: 'read',
  },
  'api:write': {
    name: 'Manage API Keys',
    description: 'Create, rotate, and revoke API keys',
    category: 'write',
  },
  'webhooks:read': {
    name: 'Read Webhooks',
    description: 'View webhook configurations and delivery logs',
    category: 'read',
  },
  'webhooks:write': {
    name: 'Manage Webhooks',
    description: 'Create, update, and delete webhooks',
    category: 'write',
  },
  'analytics:read': {
    name: 'Read Analytics',
    description: 'View analytics and metrics',
    category: 'read',
  },
  'alerts:read': {
    name: 'Read Alerts',
    description: 'View alert configurations and history',
    category: 'read',
  },
  'alerts:write': {
    name: 'Manage Alerts',
    description: 'Create and update alert subscriptions',
    category: 'write',
  },
  'admin:read': {
    name: 'Admin Read',
    description: 'Read admin dashboard data',
    category: 'admin',
  },
  'admin:write': {
    name: 'Admin Write',
    description: 'Manage admin settings',
    category: 'admin',
  },
};

/**
 * OAuth2 Service Implementation
 */
export class OAuth2Service {
  private clients: Map<string, OAuth2Client> = new Map();
  private authorizationCodes: Map<string, OAuth2AuthorizationCode> = new Map();
  private accessTokens: Map<string, { userId: number; scopes: string[]; expiresAt: Date }> = new Map();
  private refreshTokens: Map<string, { userId: number; clientId: string; expiresAt: Date }> = new Map();

  /**
   * Register a new OAuth2 client
   */
  registerClient(name: string, redirectUris: string[], requestedScopes: string[]): OAuth2Client {
    const clientId = this.generateClientId();
    const clientSecret = this.generateClientSecret();

    // Validate requested scopes
    const validScopes = requestedScopes.filter((scope) => OAUTH2_SCOPES[scope]);

    const client: OAuth2Client = {
      id: crypto.randomUUID(),
      name,
      clientId,
      clientSecret,
      redirectUris,
      scopes: validScopes,
      createdAt: new Date(),
      isActive: true,
    };

    this.clients.set(clientId, client);
    console.log(`[OAuth2] Client registered: ${name} (${clientId})`);

    return client;
  }

  /**
   * Get client by ID
   */
  getClient(clientId: string): OAuth2Client | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Validate client credentials
   */
  validateClient(clientId: string, clientSecret: string): boolean {
    const client = this.clients.get(clientId);
    return !!client && client.clientSecret === clientSecret && client.isActive;
  }

  /**
   * Generate authorization code
   */
  generateAuthorizationCode(
    clientId: string,
    userId: number,
    redirectUri: string,
    requestedScopes: string[],
  ): string {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Validate redirect URI
    if (!client.redirectUris.includes(redirectUri)) {
      throw new Error('Invalid redirect URI');
    }

    // Validate scopes
    const grantedScopes = requestedScopes.filter((scope) => client.scopes.includes(scope));

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    this.authorizationCodes.set(code, {
      code,
      clientId,
      userId,
      scopes: grantedScopes,
      redirectUri,
      expiresAt,
      used: false,
    });

    console.log(`[OAuth2] Authorization code generated for user ${userId}`);
    return code;
  }

  /**
   * Exchange authorization code for tokens
   */
  exchangeAuthorizationCode(
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string,
  ): OAuth2Token | null {
    // Validate client
    if (!this.validateClient(clientId, clientSecret)) {
      console.warn('[OAuth2] Invalid client credentials');
      return null;
    }

    // Get authorization code
    const authCode = this.authorizationCodes.get(code);
    if (!authCode) {
      console.warn('[OAuth2] Authorization code not found');
      return null;
    }

    // Validate authorization code
    if (authCode.clientId !== clientId || authCode.redirectUri !== redirectUri || authCode.used) {
      console.warn('[OAuth2] Invalid authorization code');
      return null;
    }

    if (authCode.expiresAt < new Date()) {
      console.warn('[OAuth2] Authorization code expired');
      return null;
    }

    // Mark code as used
    authCode.used = true;

    // Generate tokens
    const accessToken = this.generateAccessToken();
    const refreshToken = this.generateRefreshToken();
    const expiresIn = 3600; // 1 hour

    // Store tokens
    this.accessTokens.set(accessToken, {
      userId: authCode.userId,
      scopes: authCode.scopes,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    });

    this.refreshTokens.set(refreshToken, {
      userId: authCode.userId,
      clientId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    console.log(`[OAuth2] Tokens issued for user ${authCode.userId}`);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn,
      scope: authCode.scopes.join(' '),
    };
  }

  /**
   * Refresh access token
   */
  refreshAccessToken(refreshToken: string): OAuth2Token | null {
    const tokenData = this.refreshTokens.get(refreshToken);
    if (!tokenData) {
      console.warn('[OAuth2] Refresh token not found');
      return null;
    }

    if (tokenData.expiresAt < new Date()) {
      console.warn('[OAuth2] Refresh token expired');
      return null;
    }

    // Generate new access token
    const accessToken = this.generateAccessToken();
    const expiresIn = 3600; // 1 hour

    // Get scopes from old token
    let scopes: string[] = [];
    for (const [token, data] of this.accessTokens.entries()) {
      if (data.expiresAt > new Date()) {
        scopes = data.scopes;
        break;
      }
    }

    this.accessTokens.set(accessToken, {
      userId: tokenData.userId,
      scopes,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    });

    console.log(`[OAuth2] Access token refreshed for user ${tokenData.userId}`);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn,
      scope: scopes.join(' '),
    };
  }

  /**
   * Validate access token
   */
  validateAccessToken(accessToken: string): { userId: number; scopes: string[] } | null {
    const tokenData = this.accessTokens.get(accessToken);
    if (!tokenData) {
      return null;
    }

    if (tokenData.expiresAt < new Date()) {
      this.accessTokens.delete(accessToken);
      return null;
    }

    return {
      userId: tokenData.userId,
      scopes: tokenData.scopes,
    };
  }

  /**
   * Check if token has required scope
   */
  hasScope(accessToken: string, requiredScope: string): boolean {
    const tokenData = this.validateAccessToken(accessToken);
    if (!tokenData) {
      return false;
    }

    return tokenData.scopes.includes(requiredScope);
  }

  /**
   * Revoke access token
   */
  revokeAccessToken(accessToken: string): boolean {
    return this.accessTokens.delete(accessToken);
  }

  /**
   * Revoke refresh token
   */
  revokeRefreshToken(refreshToken: string): boolean {
    return this.refreshTokens.delete(refreshToken);
  }

  /**
   * Get available scopes
   */
  getAvailableScopes(): Record<string, OAuth2Scope> {
    return OAUTH2_SCOPES;
  }

  /**
   * Get scopes by category
   */
  getScopesByCategory(category: 'read' | 'write' | 'admin'): string[] {
    return Object.entries(OAUTH2_SCOPES)
      .filter(([_, scope]) => scope.category === category)
      .map(([name]) => name);
  }

  // Private helper methods

  private generateClientId(): string {
    return `client_${crypto.randomBytes(16).toString('hex')}`;
  }

  private generateClientSecret(): string {
    return `secret_${crypto.randomBytes(32).toString('hex')}`;
  }

  private generateCode(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateAccessToken(): string {
    return `access_${crypto.randomBytes(32).toString('hex')}`;
  }

  private generateRefreshToken(): string {
    return `refresh_${crypto.randomBytes(32).toString('hex')}`;
  }
}

// Export singleton instance
export const oauth2Service = new OAuth2Service();
