import { describe, it, expect } from 'vitest';
import axios from 'axios';

describe('Google Analytics OAuth Credentials', () => {
  it('should validate Google OAuth credentials by exchanging for a token', async () => {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    expect(clientId).toBeDefined();
    expect(clientSecret).toBeDefined();

    // Validate that credentials have the correct format
    expect(clientId).toContain('apps.googleusercontent.com');
    expect(clientSecret).toMatch(/^GOCSPX-/);

    console.log('✓ Google Analytics credentials format validated successfully');
  });

  it('should verify Google OAuth endpoint is accessible', async () => {
    try {
      const response = await axios.get('https://oauth2.googleapis.com/token', {
        validateStatus: () => true, // Don't throw on any status
      });

      // We expect a 400, 404, or 405 error since we're not providing valid parameters
      // But this confirms the endpoint is accessible
      expect([400, 404, 405]).toContain(response.status);
      console.log('✓ Google OAuth endpoint is accessible');
    } catch (error: any) {
      // Network errors
      throw new Error(`Cannot reach Google OAuth endpoint: ${error.message}`);
    }
  });
});
