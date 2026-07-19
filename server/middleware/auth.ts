import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/User";

interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  console.log("Auth middleware: Request headers:", JSON.stringify(req.headers));
  console.log("Auth middleware: Checking authorization & x-auth-token header");

  if (req.headers["x-auth-token"]) {
    token = req.headers["x-auth-token"] as string;
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      console.log("Auth middleware: Token found, verifying...");
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
      const userId = decoded.userId || decoded.id;
      req.user = await User.findById(userId).select("-password");
      if (!req.user) {
        console.warn("Auth middleware: User not found for token");
        return res.status(401).json({ message: "Not authorized, user not found" });
      }
      if (req.user.isActive === false) {
        console.warn(`Auth middleware: Deactivated user access blocked: ${req.user.email}`);
        return res.status(403).json({ message: "Forbidden - Account has been deactivated" });
      }
      console.log("Auth middleware: User authorized:", req.user.name);
      return next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    console.warn("Auth middleware: No token found in headers.");
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "taluk_admin" || req.user.role === "super_admin")) {
    next();
  } else {
    res.status(403).json({ message: "Forbidden - Not authorized as an admin" });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      console.warn(`Auth middleware: Role authorization failed. Expected roles: ${roles.join(", ")}, got: ${req.user?.role}`);
      res.status(403).json({ message: "Forbidden - Unauthorized route" });
    }
  };
};
