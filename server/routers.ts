import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import { createIntegrationService } from "./integrations";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Website management
  websites: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.getUserWebsites(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          url: z.string().url(),
          category: z.enum(["blog", "ecommerce", "portfolio", "business", "other"]),
        })
      )
      .mutation(({ ctx, input }) => {
        return db.createWebsite({
          userId: ctx.user.id,
          name: input.name,
          url: input.url,
          category: input.category,
          verified: false,
          totalVisits: 0,
          monthlyVisits: 0,
          weeklyGrowth: 0,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          verified: z.boolean().optional(),
        })
      )
      .mutation(({ input }) => {
        return db.updateWebsite(input.id, input);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => {
        return db.deleteWebsite(input.id);
      }),
  }),

  // Campaign management
  campaigns: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.getUserCampaigns(ctx.user.id);
    }),

    byWebsite: protectedProcedure
      .input(z.object({ websiteId: z.number() }))
      .query(({ input }) => {
        return db.getWebsiteCampaigns(input.websiteId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          websiteId: z.number(),
          name: z.string().min(1).max(255),
          type: z.enum(["social", "content", "seo"]),
          targetVisits: z.number().min(100),
          duration: z.number().min(1).max(365),
          budget: z.number().min(10),
        })
      )
      .mutation(({ ctx, input }) => {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + input.duration);

        return db.createCampaign({
          userId: ctx.user.id,
          websiteId: input.websiteId,
          name: input.name,
          type: input.type,
          status: "active",
          targetVisits: input.targetVisits,
          currentVisits: 0,
          duration: input.duration,
          budget: input.budget,
          startDate,
          endDate,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["active", "paused", "completed"]).optional(),
          currentVisits: z.number().optional(),
        })
      )
      .mutation(({ input }) => {
        return db.updateCampaign(input.id, input);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => {
        return db.deleteCampaign(input.id);
      }),
  }),

  // Integration management
  integrations: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.getUserIntegrations(ctx.user.id);
    }),

    getByProvider: protectedProcedure
      .input(z.object({ provider: z.string() }))
      .query(({ ctx, input }) => {
        return db.getIntegrationByProvider(ctx.user.id, input.provider);
      }),

    connect: protectedProcedure
      .input(
        z.object({
          provider: z.enum(["google_analytics", "fiverr", "facebook", "twitter", "instagram"]),
          credentials: z.record(z.string(), z.string()),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const service = createIntegrationService(input.provider);
        if (!service) {
          throw new Error(`Unknown provider: ${input.provider}`);
        }

        const authenticated = await service.authenticate(input.credentials);
        if (!authenticated) {
          throw new Error("Failed to authenticate with provider");
        }

        return db.createIntegration({
          userId: ctx.user.id,
          provider: input.provider,
          credentialData: input.credentials,
          isActive: true,
        });
      }),

    disconnect: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteIntegration(input.id);
      }),

    sync: protectedProcedure
      .input(
        z.object({
          provider: z.string(),
          websiteId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const integration = await db.getIntegrationByProvider(ctx.user.id, input.provider);
        if (!integration) {
          throw new Error("Integration not found");
        }

        const service = createIntegrationService(input.provider);
        if (!service) {
          throw new Error(`Unknown provider: ${input.provider}`);
        }

        const result = await service.sync(ctx.user.id, input.websiteId);

        // Log sync attempt
        await db.logIntegrationSync({
          userId: ctx.user.id,
          provider: input.provider as any,
          websiteId: input.websiteId,
          status: result.success ? "success" : "failed",
          errorMessage: result.error,
          syncedRecords: result.recordsSync,
        });
        return result;
      }),
  }),

  // Traffic metrics
  metrics: router({
    getWebsiteMetrics: protectedProcedure
      .input(z.object({ websiteId: z.number(), days: z.number().default(30) }))
      .query(({ input }) => {
        return db.getWebsiteMetrics(input.websiteId, input.days);
      }),

    recordMetric: protectedProcedure
      .input(
        z.object({
          websiteId: z.number(),
          visits: z.number(),
          uniqueVisitors: z.number(),
          bounceRate: z.number(),
          avgSessionDuration: z.number(),
          source: z.enum(["direct", "social", "referral", "search", "other"]),
        })
      )
      .mutation(({ ctx, input }) => {
        return db.createTrafficMetric({
          userId: ctx.user.id,
          websiteId: input.websiteId,
          date: new Date(),
          visits: input.visits,
          uniqueVisitors: input.uniqueVisitors,
          bounceRate: input.bounceRate,
          avgSessionDuration: input.avgSessionDuration,
          source: input.source,
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
