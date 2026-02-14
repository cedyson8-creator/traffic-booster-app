import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import exportRoutes from "../routes/export.routes";
import emailSchedulerRoutes from "../routes/email-scheduler.routes";
import webhooksRoutes from "../routes/webhooks.routes";
import paymentRoutes from "../routes/payments.routes";
import socialMediaRoutes from "../routes/social-media.routes";
import { ReportSchedulerService } from "../services/report-scheduler.service";
import { globalRateLimiter, endpointRateLimiter, paymentRateLimiter, exportRateLimiter, emailRateLimiter } from "../middleware/rate-limit.middleware";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Apply global rate limiting
  app.use(globalRateLimiter);
  app.use(endpointRateLimiter);

  registerOAuthRoutes(app);

  // Export routes with rate limiting
  app.use("/api/export", exportRateLimiter, exportRoutes);

  // Email scheduler routes with rate limiting
  app.use("/api/email-scheduler", emailRateLimiter, emailSchedulerRoutes);

  // Webhook routes
  app.use("/api/webhooks", webhooksRoutes);

  // Payment routes with rate limiting
  app.use("/api/payments", paymentRateLimiter, paymentRoutes);

  // Social media routes
  app.use("/api/social-media", socialMediaRoutes);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
    // Start the report scheduler for sending scheduled emails
    ReportSchedulerService.start();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[api] SIGTERM received, shutting down gracefully');
    ReportSchedulerService.stop();
    server.close(() => {
      console.log('[api] Server closed');
      process.exit(0);
    });
  });
}

startServer().catch(console.error);
