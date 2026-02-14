import { describe, it, expect, beforeEach } from 'vitest';
import { OAuth2Service, OAUTH2_SCOPES } from '../services/oauth2.service';
import { TeamManagementService, ROLE_PERMISSIONS } from '../services/team-management.service';

/**
 * Enterprise Features Tests
 * Tests for OAuth2, analytics dashboard, and team management
 */

describe('OAuth2 Service', () => {
  let oauth2Service: OAuth2Service;

  beforeEach(() => {
    oauth2Service = new OAuth2Service();
  });

  it('should register a new OAuth2 client', () => {
    const client = oauth2Service.registerClient('My App', ['https://example.com/callback'], [
      'api:read',
      'webhooks:read',
    ]);

    expect(client.name).toBe('My App');
    expect(client.clientId).toBeDefined();
    expect(client.clientSecret).toBeDefined();
    expect(client.scopes).toContain('api:read');
  });

  it('should validate client credentials', () => {
    const client = oauth2Service.registerClient('Test App', ['https://example.com/callback'], ['api:read']);

    const isValid = oauth2Service.validateClient(client.clientId, client.clientSecret);
    expect(isValid).toBe(true);
  });

  it('should reject invalid client credentials', () => {
    const client = oauth2Service.registerClient('Test App', ['https://example.com/callback'], ['api:read']);

    const isValid = oauth2Service.validateClient(client.clientId, 'wrong_secret');
    expect(isValid).toBe(false);
  });

  it('should generate authorization code', () => {
    const client = oauth2Service.registerClient('Test App', ['https://example.com/callback'], ['api:read']);

    const code = oauth2Service.generateAuthorizationCode(
      client.clientId,
      123,
      'https://example.com/callback',
      ['api:read'],
    );

    expect(code).toBeDefined();
    expect(code.length).toBeGreaterThan(0);
  });

  it('should exchange authorization code for tokens', () => {
    const client = oauth2Service.registerClient('Test App', ['https://example.com/callback'], ['api:read']);

    const code = oauth2Service.generateAuthorizationCode(
      client.clientId,
      123,
      'https://example.com/callback',
      ['api:read'],
    );

    const tokens = oauth2Service.exchangeAuthorizationCode(
      client.clientId,
      client.clientSecret,
      code,
      'https://example.com/callback',
    );

    expect(tokens).not.toBeNull();
    expect(tokens?.accessToken).toBeDefined();
    expect(tokens?.refreshToken).toBeDefined();
    expect(tokens?.tokenType).toBe('Bearer');
  });

  it('should validate access token', () => {
    const client = oauth2Service.registerClient('Test App', ['https://example.com/callback'], ['api:read']);

    const code = oauth2Service.generateAuthorizationCode(
      client.clientId,
      123,
      'https://example.com/callback',
      ['api:read'],
    );

    const tokens = oauth2Service.exchangeAuthorizationCode(
      client.clientId,
      client.clientSecret,
      code,
      'https://example.com/callback',
    );

    const tokenData = oauth2Service.validateAccessToken(tokens!.accessToken);
    expect(tokenData).not.toBeNull();
    expect(tokenData?.userId).toBe(123);
    expect(tokenData?.scopes).toContain('api:read');
  });

  it('should check token scope', () => {
    const client = oauth2Service.registerClient('Test App', ['https://example.com/callback'], [
      'api:read',
      'webhooks:write',
    ]);

    const code = oauth2Service.generateAuthorizationCode(
      client.clientId,
      123,
      'https://example.com/callback',
      ['api:read', 'webhooks:write'],
    );

    const tokens = oauth2Service.exchangeAuthorizationCode(
      client.clientId,
      client.clientSecret,
      code,
      'https://example.com/callback',
    );

    expect(oauth2Service.hasScope(tokens!.accessToken, 'api:read')).toBe(true);
    expect(oauth2Service.hasScope(tokens!.accessToken, 'webhooks:write')).toBe(true);
    expect(oauth2Service.hasScope(tokens!.accessToken, 'admin:write')).toBe(false);
  });

  it('should refresh access token', () => {
    const client = oauth2Service.registerClient('Test App', ['https://example.com/callback'], ['api:read']);

    const code = oauth2Service.generateAuthorizationCode(
      client.clientId,
      123,
      'https://example.com/callback',
      ['api:read'],
    );

    const tokens = oauth2Service.exchangeAuthorizationCode(
      client.clientId,
      client.clientSecret,
      code,
      'https://example.com/callback',
    );

    const newTokens = oauth2Service.refreshAccessToken(tokens!.refreshToken);
    expect(newTokens).not.toBeNull();
    expect(newTokens?.accessToken).toBeDefined();
  });

  it('should get available scopes', () => {
    const scopes = oauth2Service.getAvailableScopes();
    expect(Object.keys(scopes).length).toBeGreaterThan(0);
    expect(scopes['api:read']).toBeDefined();
  });

  it('should get scopes by category', () => {
    const readScopes = oauth2Service.getScopesByCategory('read');
    expect(readScopes.length).toBeGreaterThan(0);
    expect(readScopes).toContain('api:read');
  });
});

describe('Team Management Service', () => {
  let teamService: TeamManagementService;

  beforeEach(() => {
    teamService = new TeamManagementService();
  });

  it('should create an organization', () => {
    const org = teamService.createOrganization('Acme Corp', 1, 'pro');

    expect(org.name).toBe('Acme Corp');
    expect(org.ownerId).toBe(1);
    expect(org.plan).toBe('pro');
    expect(org.maxMembers).toBe(10);
  });

  it('should get organization by ID', () => {
    const org = teamService.createOrganization('Test Org', 1);
    const retrieved = teamService.getOrganization(org.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Test Org');
  });

  it('should get user organizations', () => {
    const org1 = teamService.createOrganization('Org 1', 1);
    const org2 = teamService.createOrganization('Org 2', 2);

    const userOrgs = teamService.getUserOrganizations(1);
    expect(userOrgs.length).toBe(1);
    expect(userOrgs[0].id).toBe(org1.id);
  });

  it('should invite team member', () => {
    const org = teamService.createOrganization('Test Org', 1, 'pro');

    const invitationCode = teamService.inviteTeamMember(org.id, 'dev@example.com', 'developer', 1);
    expect(invitationCode).toBeDefined();
  });

  it('should accept invitation', () => {
    const org = teamService.createOrganization('Test Org', 1, 'pro');

    const invitationCode = teamService.inviteTeamMember(org.id, 'dev@example.com', 'developer', 1);
    const member = teamService.acceptInvitation(invitationCode, 2, 'dev@example.com', 'Developer User');

    expect(member).not.toBeNull();
    expect(member?.userId).toBe(2);
    expect(member?.role).toBe('developer');
  });

  it('should get team members', () => {
    const org = teamService.createOrganization('Test Org', 1, 'pro');

    const invitationCode = teamService.inviteTeamMember(org.id, 'dev@example.com', 'developer', 1);
    teamService.acceptInvitation(invitationCode, 2, 'dev@example.com', 'Developer User');

    const members = teamService.getTeamMembers(org.id);
    expect(members.length).toBe(2);
  });

  it('should update team member role', () => {
    const org = teamService.createOrganization('Test Org', 1, 'pro');

    const invitationCode = teamService.inviteTeamMember(org.id, 'dev@example.com', 'developer', 1);
    teamService.acceptInvitation(invitationCode, 2, 'dev@example.com', 'Developer User');

    const updated = teamService.updateTeamMemberRole(org.id, 2, 'admin');
    expect(updated?.role).toBe('admin');
  });

  it('should remove team member', () => {
    const org = teamService.createOrganization('Test Org', 1, 'pro');

    const invitationCode = teamService.inviteTeamMember(org.id, 'dev@example.com', 'developer', 1);
    teamService.acceptInvitation(invitationCode, 2, 'dev@example.com', 'Developer User');

    const removed = teamService.removeTeamMember(org.id, 2);
    expect(removed).toBe(true);

    const member = teamService.getTeamMember(org.id, 2);
    expect(member?.isActive).toBe(false);
  });

  it('should check user permissions', () => {
    const org = teamService.createOrganization('Test Org', 1, 'pro');

    const invitationCode = teamService.inviteTeamMember(org.id, 'dev@example.com', 'developer', 1);
    teamService.acceptInvitation(invitationCode, 2, 'dev@example.com', 'Developer User');

    expect(teamService.hasPermission(org.id, 2, 'api:read')).toBe(true);
    expect(teamService.hasPermission(org.id, 2, 'admin:write')).toBe(false);
  });

  it('should check if user is admin', () => {
    const org = teamService.createOrganization('Test Org', 1, 'pro');

    expect(teamService.isOrganizationAdmin(org.id, 1)).toBe(true);

    const invitationCode = teamService.inviteTeamMember(org.id, 'dev@example.com', 'developer', 1);
    teamService.acceptInvitation(invitationCode, 2, 'dev@example.com', 'Developer User');

    expect(teamService.isOrganizationAdmin(org.id, 2)).toBe(false);
  });

  it('should get role permissions', () => {
    const adminPerms = teamService.getRolePermissions('admin');
    const devPerms = teamService.getRolePermissions('developer');
    const viewerPerms = teamService.getRolePermissions('viewer');

    expect(adminPerms.length).toBeGreaterThan(devPerms.length);
    expect(devPerms.length).toBeGreaterThan(viewerPerms.length);
  });

  it('should update organization plan', () => {
    const org = teamService.createOrganization('Test Org', 1, 'free');
    expect(org.maxMembers).toBe(1);

    const updated = teamService.updateOrganizationPlan(org.id, 'enterprise');
    expect(updated?.maxMembers).toBe(100);
  });

  it('should get organization stats', () => {
    const org = teamService.createOrganization('Test Org', 1, 'pro');

    const invitationCode = teamService.inviteTeamMember(org.id, 'dev@example.com', 'developer', 1);
    teamService.acceptInvitation(invitationCode, 2, 'dev@example.com', 'Developer User');

    const stats = teamService.getOrganizationStats(org.id);
    expect(stats?.totalMembers).toBe(2);
    expect(stats?.activeMembers).toBe(2);
    expect(stats?.admins).toBe(1);
    expect(stats?.developers).toBe(1);
  });
});

describe('Integration Tests', () => {
  it('should handle complete OAuth2 flow', () => {
    const oauth2Service = new OAuth2Service();

    // 1. Register client
    const client = oauth2Service.registerClient('My App', ['https://example.com/callback'], [
      'api:read',
      'webhooks:write',
    ]);

    // 2. Generate authorization code
    const code = oauth2Service.generateAuthorizationCode(
      client.clientId,
      123,
      'https://example.com/callback',
      ['api:read', 'webhooks:write'],
    );

    // 3. Exchange for tokens
    const tokens = oauth2Service.exchangeAuthorizationCode(
      client.clientId,
      client.clientSecret,
      code,
      'https://example.com/callback',
    );

    expect(tokens).not.toBeNull();
    expect(oauth2Service.hasScope(tokens!.accessToken, 'api:read')).toBe(true);
  });

  it('should handle complete team management flow', () => {
    const teamService = new TeamManagementService();

    // 1. Create organization
    const org = teamService.createOrganization('Acme Corp', 1, 'pro');

    // 2. Invite team members
    const devInvite = teamService.inviteTeamMember(org.id, 'dev@example.com', 'developer', 1);
    const viewerInvite = teamService.inviteTeamMember(org.id, 'viewer@example.com', 'viewer', 1);

    // 3. Accept invitations
    const devMember = teamService.acceptInvitation(devInvite, 2, 'dev@example.com', 'Developer');
    const viewerMember = teamService.acceptInvitation(viewerInvite, 3, 'viewer@example.com', 'Viewer');

    // 4. Verify permissions
    expect(teamService.hasPermission(org.id, 2, 'api:write')).toBe(true);
    expect(teamService.hasPermission(org.id, 3, 'api:write')).toBe(false);

    // 5. Get stats
    const stats = teamService.getOrganizationStats(org.id);
    expect(stats?.totalMembers).toBe(3);
    expect(stats?.developers).toBe(1);
    expect(stats?.viewers).toBe(1);
  });

  it('should enforce role-based access control', () => {
    const teamService = new TeamManagementService();

    const org = teamService.createOrganization('Test Org', 1, 'pro');

    // Admin can do everything
    expect(teamService.hasPermission(org.id, 1, 'admin:write')).toBe(true);
    expect(teamService.hasPermission(org.id, 1, 'api:write')).toBe(true);

    // Developer can read and write API/webhooks but not admin
    const devInvite = teamService.inviteTeamMember(org.id, 'dev@example.com', 'developer', 1);
    teamService.acceptInvitation(devInvite, 2, 'dev@example.com', 'Developer');

    expect(teamService.hasPermission(org.id, 2, 'api:write')).toBe(true);
    expect(teamService.hasPermission(org.id, 2, 'admin:write')).toBe(false);

    // Viewer can only read
    const viewerInvite = teamService.inviteTeamMember(org.id, 'viewer@example.com', 'viewer', 1);
    teamService.acceptInvitation(viewerInvite, 3, 'viewer@example.com', 'Viewer');

    expect(teamService.hasPermission(org.id, 3, 'api:read')).toBe(true);
    expect(teamService.hasPermission(org.id, 3, 'api:write')).toBe(false);
  });
});
