import crypto from 'crypto';

/**
 * Webhook Signatures Service
 * Implements HMAC-SHA256 signature generation and verification for webhooks
 */

export interface SignedWebhookPayload {
  payload: Record<string, any>;
  signature: string;
  timestamp: number;
  nonce: string;
}

export interface WebhookSignatureConfig {
  secret: string;
  algorithm: 'sha256' | 'sha512';
  timestampTolerance: number; // in seconds
}

/**
 * Webhook Signatures Service
 */
export class WebhookSignaturesService {
  /**
   * Generate webhook secret
   */
  static generateSecret(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate signature for webhook payload
   */
  static generateSignature(
    payload: Record<string, any>,
    secret: string,
    algorithm: 'sha256' | 'sha512' = 'sha256',
  ): { signature: string; timestamp: number; nonce: string } {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');

    // Create signed content: timestamp.nonce.payload
    const payloadString = JSON.stringify(payload);
    const signedContent = `${timestamp}.${nonce}.${payloadString}`;

    // Generate HMAC signature
    const hmac = crypto.createHmac(algorithm, secret);
    hmac.update(signedContent);
    const signature = hmac.digest('hex');

    return {
      signature,
      timestamp,
      nonce,
    };
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(
    payload: Record<string, any>,
    signature: string,
    secret: string,
    timestamp: number,
    nonce: string,
    algorithm: 'sha256' | 'sha512' = 'sha256',
    timestampTolerance: number = 300, // 5 minutes
  ): { valid: boolean; error?: string } {
    // Check timestamp to prevent replay attacks
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const timeDifference = Math.abs(currentTimestamp - timestamp);

    if (timeDifference > timestampTolerance) {
      return {
        valid: false,
        error: `Timestamp outside tolerance window (${timeDifference}s > ${timestampTolerance}s)`,
      };
    }

    // Recreate signed content
    const payloadString = JSON.stringify(payload);
    const signedContent = `${timestamp}.${nonce}.${payloadString}`;

    // Generate expected signature
    const hmac = crypto.createHmac(algorithm, secret);
    hmac.update(signedContent);
    const expectedSignature = hmac.digest('hex');

    // Compare signatures using constant-time comparison
    // First check if lengths match to avoid timing attacks
    if (signature.length !== expectedSignature.length) {
      return {
        valid: false,
        error: 'Signature mismatch',
      };
    }
    const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

    if (!isValid) {
      return {
        valid: false,
        error: 'Signature mismatch',
      };
    }

    return { valid: true };
  }

  /**
   * Create signed webhook payload
   */
  static createSignedPayload(
    payload: Record<string, any>,
    secret: string,
    algorithm: 'sha256' | 'sha512' = 'sha256',
  ): SignedWebhookPayload {
    const { signature, timestamp, nonce } = this.generateSignature(payload, secret, algorithm);

    return {
      payload,
      signature,
      timestamp,
      nonce,
    };
  }

  /**
   * Extract and verify signature from headers
   */
  static verifyFromHeaders(
    payload: Record<string, any>,
    headers: Record<string, string>,
    secret: string,
    algorithm: 'sha256' | 'sha512' = 'sha256',
    timestampTolerance: number = 300,
  ): { valid: boolean; error?: string } {
    // Get signature from header (format: "signature=<sig> timestamp=<ts> nonce=<nonce>")
    const signatureHeader = headers['x-webhook-signature'] || headers['webhook-signature'];
    const timestampHeader = headers['x-webhook-timestamp'] || headers['webhook-timestamp'];
    const nonceHeader = headers['x-webhook-nonce'] || headers['webhook-nonce'];

    if (!signatureHeader || !timestampHeader || !nonceHeader) {
      return {
        valid: false,
        error: 'Missing signature headers',
      };
    }

    // Parse signature header
    const signatureParts = signatureHeader.match(/signature=([a-f0-9]+)/);
    if (!signatureParts) {
      return {
        valid: false,
        error: 'Invalid signature header format',
      };
    }

    const signature = signatureParts[1];
    const timestamp = parseInt(timestampHeader, 10);
    const nonce = nonceHeader;

    if (isNaN(timestamp)) {
      return {
        valid: false,
        error: 'Invalid timestamp',
      };
    }

    return this.verifySignature(payload, signature, secret, timestamp, nonce, algorithm, timestampTolerance);
  }

  /**
   * Get webhook signature headers
   */
  static getSignatureHeaders(
    payload: Record<string, any>,
    secret: string,
    algorithm: 'sha256' | 'sha512' = 'sha256',
  ): Record<string, string> {
    const { signature, timestamp, nonce } = this.generateSignature(payload, secret, algorithm);

    return {
      'x-webhook-signature': `signature=${signature}`,
      'x-webhook-timestamp': timestamp.toString(),
      'x-webhook-nonce': nonce,
      'x-webhook-algorithm': algorithm,
    };
  }

  /**
   * Validate webhook secret format
   */
  static isValidSecret(secret: string): boolean {
    // Secret should be at least 32 hex characters (16 bytes)
    return /^[a-f0-9]{64,}$/i.test(secret);
  }
}
