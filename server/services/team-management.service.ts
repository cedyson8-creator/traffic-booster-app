/**
 * Team Management Service
 * Implements organization/team management with role-based access control
 */

export type UserRole = 'admin' | 'developer' | 'viewer';

export interface TeamMember {
  id: string;
  userId: number;
  organizationId: string;
  email: string;
  name: string;
  role: UserRole;
  joinedAt: Date;
  isActive: boolean;
  lastActivityAt?: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  plan: 'free' | 'pro' | 'enterprise';
  maxMembers: number;
  maxSharedKeys: number;
}

export interface RolePermission {
  role: UserRole;
  permissions: string[];
}

/**
 * Role-based permissions matrix
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    // API Keys
    'api:read',
    'api:write',
    'api:delete',
    'api:rotate',
    // Webhooks
    'webhooks:read',
    'webhooks:write',
    'webhooks:delete',
    'webhooks:test',
    // Analytics
    'analytics:read',
    'analytics:export',
    // Alerts
    'alerts:read',
    'alerts:write',
    'alerts:delete',
    // Team Management
    'team:read',
    'team:write',
    'team:invite',
    'team:remove',
    'team:roles',
    // Billing
    'billing:read',
    'billing:write',
    'billing:manage',
    // Admin
    'admin:read',
    'admin:write',
    'admin:settings',
  ],
  developer: [
    // API Keys
    'api:read',
    'api:write',
    'api:rotate',
    // Webhooks
    'webhooks:read',
    'webhooks:write',
    'webhooks:test',
    // Analytics
    'analytics:read',
    'analytics:export',
    // Alerts
    'alerts:read',
    'alerts:write',
    // Team Management
    'team:read',
  ],
  viewer: [
    // Read-only access
    'api:read',
    'webhooks:read',
    'analytics:read',
    'alerts:read',
    'team:read',
  ],
};

/**
 * Team Management Service
 */
export class TeamManagementService {
  private organizations: Map<string, Organization> = new Map();
  private teamMembers: Map<string, TeamMember[]> = new Map();
  private invitations: Map<string, { email: string; organizationId: string; role: UserRole; expiresAt: Date }> =
    new Map();

  /**
   * Create a new organization
   */
  createOrganization(name: string, ownerId: number, plan: 'free' | 'pro' | 'enterprise' = 'free'): Organization {
    const id = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const maxMembers = plan === 'free' ? 1 : plan === 'pro' ? 10 : 100;
    const maxSharedKeys = plan === 'free' ? 0 : plan === 'pro' ? 5 : 50;

    const organization: Organization = {
      id,
      name,
      slug,
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      plan,
      maxMembers,
      maxSharedKeys,
    };

    this.organizations.set(id, organization);
    this.teamMembers.set(id, [
      {
        id: `member_${Date.now()}`,
        userId: ownerId,
        organizationId: id,
        email: 'owner@example.com',
        name: 'Organization Owner',
        role: 'admin',
        joinedAt: new Date(),
        isActive: true,
      },
    ]);

    console.log(`[TeamManagement] Organization created: ${name} (${id})`);
    return organization;
  }

  /**
   * Get organization by ID
   */
  getOrganization(organizationId: string): Organization | undefined {
    return this.organizations.get(organizationId);
  }

  /**
   * Get user's organizations
   */
  getUserOrganizations(userId: number): Organization[] {
    const orgs: Organization[] = [];

    for (const [_, members] of this.teamMembers.entries()) {
      const member = members.find((m) => m.userId === userId && m.isActive);
      if (member) {
        const org = this.organizations.get(member.organizationId);
        if (org && org.isActive) {
          orgs.push(org);
        }
      }
    }

    return orgs;
  }

  /**
   * Invite team member
   */
  inviteTeamMember(organizationId: string, email: string, role: UserRole, invitedBy: number): string {
    const org = this.organizations.get(organizationId);
    if (!org) {
      throw new Error('Organization not found');
    }

    const members = this.teamMembers.get(organizationId) || [];
    if (members.length >= org.maxMembers) {
      throw new Error('Organization has reached maximum member limit');
    }

    const invitationCode = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    this.invitations.set(invitationCode, {
      email,
      organizationId,
      role,
      expiresAt,
    });

    console.log(`[TeamManagement] Invitation sent to ${email} for organization ${organizationId}`);
    return invitationCode;
  }

  /**
   * Accept team invitation
   */
  acceptInvitation(invitationCode: string, userId: number, userEmail: string, userName: string): TeamMember | null {
    const invitation = this.invitations.get(invitationCode);
    if (!invitation) {
      console.warn('[TeamManagement] Invitation not found');
      return null;
    }

    if (invitation.expiresAt < new Date()) {
      console.warn('[TeamManagement] Invitation expired');
      return null;
    }

    if (invitation.email !== userEmail) {
      console.warn('[TeamManagement] Email mismatch');
      return null;
    }

    const members = this.teamMembers.get(invitation.organizationId) || [];

    // Check if user is already a member
    if (members.some((m) => m.userId === userId)) {
      console.warn('[TeamManagement] User is already a member');
      return null;
    }

    const member: TeamMember = {
      id: `member_${Date.now()}`,
      userId,
      organizationId: invitation.organizationId,
      email: userEmail,
      name: userName,
      role: invitation.role,
      joinedAt: new Date(),
      isActive: true,
    };

    members.push(member);
    this.teamMembers.set(invitation.organizationId, members);
    this.invitations.delete(invitationCode);

    console.log(`[TeamManagement] User ${userId} joined organization ${invitation.organizationId}`);
    return member;
  }

  /**
   * Get team members
   */
  getTeamMembers(organizationId: string): TeamMember[] {
    return this.teamMembers.get(organizationId) || [];
  }

  /**
   * Get team member
   */
  getTeamMember(organizationId: string, userId: number): TeamMember | undefined {
    const members = this.teamMembers.get(organizationId) || [];
    return members.find((m) => m.userId === userId);
  }

  /**
   * Update team member role
   */
  updateTeamMemberRole(organizationId: string, userId: number, newRole: UserRole): TeamMember | null {
    const members = this.teamMembers.get(organizationId);
    if (!members) {
      return null;
    }

    const member = members.find((m) => m.userId === userId);
    if (!member) {
      return null;
    }

    member.role = newRole;
    member.lastActivityAt = new Date();

    console.log(`[TeamManagement] User ${userId} role updated to ${newRole}`);
    return member;
  }

  /**
   * Remove team member
   */
  removeTeamMember(organizationId: string, userId: number): boolean {
    const members = this.teamMembers.get(organizationId);
    if (!members) {
      return false;
    }

    const member = members.find((m) => m.userId === userId);
    if (!member) {
      return false;
    }

    member.isActive = false;
    console.log(`[TeamManagement] User ${userId} removed from organization`);
    return true;
  }

  /**
   * Check user permission
   */
  hasPermission(organizationId: string, userId: number, permission: string): boolean {
    const member = this.getTeamMember(organizationId, userId);
    if (!member) {
      return false;
    }

    const permissions = ROLE_PERMISSIONS[member.role];
    return permissions.includes(permission);
  }

  /**
   * Check if user is organization admin
   */
  isOrganizationAdmin(organizationId: string, userId: number): boolean {
    const member = this.getTeamMember(organizationId, userId);
    return member?.role === 'admin' || false;
  }

  /**
   * Get role permissions
   */
  getRolePermissions(role: UserRole): string[] {
    return ROLE_PERMISSIONS[role];
  }

  /**
   * Update organization plan
   */
  updateOrganizationPlan(organizationId: string, newPlan: 'free' | 'pro' | 'enterprise'): Organization | null {
    const org = this.organizations.get(organizationId);
    if (!org) {
      return null;
    }

    org.plan = newPlan;
    org.maxMembers = newPlan === 'free' ? 1 : newPlan === 'pro' ? 10 : 100;
    org.maxSharedKeys = newPlan === 'free' ? 0 : newPlan === 'pro' ? 5 : 50;
    org.updatedAt = new Date();

    console.log(`[TeamManagement] Organization ${organizationId} plan updated to ${newPlan}`);
    return org;
  }

  /**
   * Get organization stats
   */
  getOrganizationStats(organizationId: string): {
    totalMembers: number;
    activeMembers: number;
    admins: number;
    developers: number;
    viewers: number;
  } | null {
    const members = this.teamMembers.get(organizationId);
    if (!members) {
      return null;
    }

    const activeMembers = members.filter((m) => m.isActive);

    return {
      totalMembers: members.length,
      activeMembers: activeMembers.length,
      admins: activeMembers.filter((m) => m.role === 'admin').length,
      developers: activeMembers.filter((m) => m.role === 'developer').length,
      viewers: activeMembers.filter((m) => m.role === 'viewer').length,
    };
  }
}

// Export singleton instance
export const teamManagementService = new TeamManagementService();
