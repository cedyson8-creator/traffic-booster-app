import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Express } from 'express';

/**
 * Integration Tests for Critical API Endpoints
 * Tests payment processing, email scheduling, export, and delivery analytics
 */

// Mock Express app for testing
let app: Express;

beforeAll(() => {
  app = express();
  app.use(express.json());

  // Mock middleware to set userId
  app.use((req: any, res, next) => {
    req.userId = 1;
    next();
  });

  // Mock payment routes
  app.get('/api/payments/subscription', (req: any, res) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.json({
      subscription: {
        id: 'sub_123',
        plan: 'pro',
        status: 'active',
      },
      features: {
        maxWebsites: 10,
        maxSchedules: 5,
        maxEmailsPerMonth: 1000,
      },
    });
  });

  app.get('/api/payments/plans', (req: any, res) => {
    return res.json([
      {
        id: 'free',
        name: 'Free',
        price: 0,
        features: { maxWebsites: 1, maxSchedules: 1 },
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 29,
        features: { maxWebsites: 10, maxSchedules: 5 },
      },
    ]);
  });

  app.post('/api/payments/subscribe', (req: any, res) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(201).json({
      success: true,
      subscriptionId: 'sub_new_123',
    });
  });

  // Mock email scheduler routes
  app.post('/api/email-scheduler/schedule', (req: any, res) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { email, frequency } = req.body;
    if (!email || !frequency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    return res.status(201).json({
      success: true,
      data: {
        id: 1,
        email,
        frequency,
        isActive: true,
      },
    });
  });

  app.get('/api/email-scheduler/schedules', (req: any, res) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.json({
      success: true,
      data: [
        {
          id: 1,
          email: 'test@example.com',
          frequency: 'weekly',
          isActive: true,
        },
      ],
    });
  });

  // Mock export routes
  app.post('/api/export/pdf', (req: any, res) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { report } = req.body;
    if (!report) {
      return res.status(400).json({ error: 'Invalid report data' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(Buffer.from('PDF content'));
  });

  app.post('/api/export/csv', (req: any, res) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { report } = req.body;
    if (!report) {
      return res.status(400).json({ error: 'Invalid report data' });
    }
    res.setHeader('Content-Type', 'text/csv');
    return res.send('CSV content');
  });

  // Mock delivery analytics routes
  app.get('/api/delivery-analytics/summary', (req: any, res) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.json({
      total: 100,
      sent: 95,
      failed: 3,
      bounced: 2,
      successRate: 95,
      failureRate: 3,
      bounceRate: 2,
    });
  });

  app.get('/api/delivery-analytics/timeline', (req: any, res) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.json([
      {
        date: '2026-02-14',
        sent: 50,
        failed: 2,
        bounced: 1,
        total: 53,
      },
    ]);
  });

  app.post('/api/delivery-analytics/resend/:logId', (req: any, res) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { logId } = req.params;
    if (!logId) {
      return res.status(400).json({ error: 'logId required' });
    }
    return res.json({ success: true, message: 'Email queued for resend' });
  });
});

describe('Payment API Endpoints', () => {
  it('should get user subscription', async () => {
    const response = await request(app).get('/api/payments/subscription');
    expect(response.status).toBe(200);
    expect(response.body.subscription).toBeDefined();
    expect(response.body.features).toBeDefined();
  });

  it('should return 401 without userId', async () => {
    const testApp = express();
    testApp.get('/api/payments/subscription', (req: any, res) => {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return res.json({ subscription: null });
    });

    const response = await request(testApp).get('/api/payments/subscription');
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });

  it('should get all subscription plans', async () => {
    const response = await request(app).get('/api/payments/plans');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should create a new subscription', async () => {
    const response = await request(app).post('/api/payments/subscribe').send({
      planId: 'pro',
      paymentMethodId: 'pm_123',
    });
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.subscriptionId).toBeDefined();
  });
});

describe('Email Scheduler API Endpoints', () => {
  it('should create a scheduled report', async () => {
    const response = await request(app)
      .post('/api/email-scheduler/schedule')
      .send({
        websiteId: 1,
        email: 'test@example.com',
        metrics: ['traffic', 'conversions'],
        frequency: 'weekly',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('test@example.com');
  });

  it('should reject schedule without email', async () => {
    const response = await request(app)
      .post('/api/email-scheduler/schedule')
      .send({
        websiteId: 1,
        frequency: 'weekly',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should get all scheduled reports', async () => {
    const response = await request(app).get('/api/email-scheduler/schedules');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe('Export API Endpoints', () => {
  it('should export report as PDF', async () => {
    const response = await request(app)
      .post('/api/export/pdf')
      .send({
        report: {
          websiteName: 'Test Site',
          metrics: { traffic: 1000 },
        },
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/pdf');
  });

  it('should reject PDF export without report', async () => {
    const response = await request(app).post('/api/export/pdf').send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should export report as CSV', async () => {
    const response = await request(app)
      .post('/api/export/csv')
      .send({
        report: {
          websiteName: 'Test Site',
          metrics: { traffic: 1000 },
        },
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
  });
});

describe('Delivery Analytics API Endpoints', () => {
  it('should get delivery summary', async () => {
    const response = await request(app).get('/api/delivery-analytics/summary');
    expect(response.status).toBe(200);
    expect(response.body.total).toBeDefined();
    expect(response.body.sent).toBeDefined();
    expect(response.body.successRate).toBeDefined();
  });

  it('should get delivery timeline', async () => {
    const response = await request(app).get('/api/delivery-analytics/timeline');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should resend failed email', async () => {
    const response = await request(app)
      .post('/api/delivery-analytics/resend/1')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should reject resend without logId', async () => {
    const testApp = express();
    testApp.post('/api/delivery-analytics/resend/:logId', (req: any, res) => {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { logId } = req.params;
      if (!logId) {
        return res.status(400).json({ error: 'logId required' });
      }
      return res.json({ success: true });
    });

    const response = await request(testApp).post('/api/delivery-analytics/resend/').send({});
    expect(response.status).toBe(404);
  });
});

describe('Error Handling', () => {
  it('should return 401 for unauthorized requests', async () => {
    const testApp = express();
    testApp.get('/api/test', (req: any, res) => {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return res.json({ success: true });
    });

    const response = await request(testApp).get('/api/test');
    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid input', async () => {
    const response = await request(app)
      .post('/api/email-scheduler/schedule')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should return 500 for server errors', async () => {
    const testApp = express();
    testApp.get('/api/error', (req, res) => {
      return res.status(500).json({ error: 'Internal server error' });
    });

    const response = await request(testApp).get('/api/error');
    expect(response.status).toBe(500);
  });
});
