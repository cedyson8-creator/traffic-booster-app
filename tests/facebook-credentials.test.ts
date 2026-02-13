import { describe, it, expect } from 'vitest';
import axios from 'axios';

describe('Facebook API Credentials', () => {
  it('should validate Facebook App credentials by fetching app info', async () => {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    expect(appId).toBeDefined();
    expect(appSecret).toBeDefined();

    // Test the credentials by making a simple API call to get app info
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v19.0/${appId}?access_token=${appId}|${appSecret}`
      );

      // If we get a successful response, the credentials are valid
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data.id).toBe(appId);

      console.log('✓ Facebook credentials validated successfully');
    } catch (error: any) {
      // If the credentials are invalid, the API will return an error
      if (error.response?.status === 400 || error.response?.status === 401) {
        throw new Error(
          `Invalid Facebook credentials: ${error.response?.data?.error?.message || error.message}`
        );
      }
      // Network errors or other issues
      throw error;
    }
  });
});
