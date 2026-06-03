import { Request, Response, NextFunction } from "express";

// Simple in-memory storage for rate limiting
interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitInfo>();

export const loginRateLimiter = (maxRequests = 5, windowMs = 5 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
    const now = Date.now();

    const record = rateLimitStore.get(ip);

    if (!record) {
      rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (now > record.resetTime) {
      // Window expired, reset
      rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    // Window active, register request
    record.count += 1;
    if (record.count > maxRequests) {
      const remainingSeconds = Math.ceil((record.resetTime - now) / 1000);
      return res.status(429).json({
        message: `Too many login attempts from this IP, please try again in ${remainingSeconds} seconds.`,
      });
    }

    next();
  };
};
