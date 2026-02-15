import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("Google Analytics Integration", () => {
  beforeAll(() => {
    // Verify environment variables are set
    expect(process.env.GOOGLE_ANALYTICS_PROJECT_ID).toBeDefined();
    expect(process.env.GOOGLE_ANALYTICS_PROPERTY_ID).toBeDefined();
    expect(process.env.GOOGLE_ANALYTICS_PRIVATE_KEY_ID).toBeDefined();
    expect(process.env.GOOGLE_ANALYTICS_PRIVATE_KEY).toBeDefined();
    expect(process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL).toBeDefined();
  });

  it("should have valid Google Analytics credentials", () => {
    const projectId = process.env.GOOGLE_ANALYTICS_PROJECT_ID;
    const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
    const privateKeyId = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY_ID;
    const privateKey = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY;
    const clientEmail = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;

    // Validate project ID format
    expect(projectId).toMatch(/^[a-z0-9-]+$/);

    // Validate property ID
    expect(propertyId).toBeDefined();

    // Validate private key ID format (hex string)
    expect(privateKeyId).toMatch(/^[a-f0-9]{40}$/);

    // Validate private key format (PEM)
    expect(privateKey).toContain("BEGIN PRIVATE KEY");
    expect(privateKey).toContain("END PRIVATE KEY");

    // Validate client email format
    expect(clientEmail).toMatch(/^[a-z0-9-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com$/);
  });

  it("should have properly formatted private key", () => {
    const privateKey = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY;
    
    // Check key structure
    expect(privateKey).toContain("-----BEGIN PRIVATE KEY-----");
    expect(privateKey).toContain("-----END PRIVATE KEY-----");
    
    // Check that key has content between markers
    const keyContent = privateKey
      ?.replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .trim();
    
    expect(keyContent?.length).toBeGreaterThan(100);
  });

  it("should have valid Google Analytics property ID", () => {
    const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
    
    // Property ID should be numeric or match GA4 format
    expect(propertyId).toBeDefined();
    expect(propertyId?.length).toBeGreaterThan(0);
  });

  it("should have matching project ID and client email", () => {
    const projectId = process.env.GOOGLE_ANALYTICS_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;
    
    // Client email should contain the project ID
    expect(clientEmail).toContain(projectId);
  });
});
