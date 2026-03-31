import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./server/config/db";
import authRoutes from "./server/routes/authRoutes";
import issueRoutes from "./server/routes/issueRoutes";
import mongoose from "mongoose";

dotenv.config();

// Connect to database
const dbConnected = await connectDB();
if (!dbConnected) {
  console.error("CRITICAL: Failed to connect to MongoDB. Database operations will fail.");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Validate critical environment variables
  const requiredEnv = ["MONGODB_URI", "JWT_SECRET", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
  const missingEnv = requiredEnv.filter(env => !process.env[env]);
  
  if (missingEnv.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingEnv.join(", ")}`);
    console.warn("The application may not function correctly until these are configured in the Secrets panel.");
  }

  app.use(cors());
  app.use(express.json());

  // Database connection check middleware
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/api") && req.originalUrl !== "/api/health") {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
          message: "Database connection not established. Please ensure MONGODB_URI is configured in the Secrets panel.",
          status: "unavailable"
        });
      }
    }
    next();
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/issues", issueRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "Smart City API is running",
      env: {
        node_env: process.env.NODE_ENV,
        mongo_uri: !!process.env.MONGODB_URI,
        jwt_secret: !!process.env.JWT_SECRET,
        cloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Explicitly handle SPA in dev if vite middleware doesn't
    app.get("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();
      try {
        const template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        next(e);
      }
    });
  } else {
    console.log("Starting in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    if (!fs.existsSync(distPath)) {
      console.error("Error: 'dist' directory not found. Please run 'npm run build' first.");
    }
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Error Handler:", err);
    res.status(err.status || 500).json({
      message: err.message || "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? err : {}
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
