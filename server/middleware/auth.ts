import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/User";

interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  console.log("Auth middleware: Request headers:", JSON.stringify(req.headers));
  console.log("Auth middleware: Checking authorization header", req.headers.authorization ? "Present" : "Missing");

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("Auth middleware: Token found, verifying...");
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        console.warn("Auth middleware: User not found for token");
        return res.status(401).json({ message: "Not authorized, user not found" });
      }
      console.log("Auth middleware: User authorized:", req.user.name);
      return next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    console.warn("Auth middleware: No Bearer token found in headers. Authorization header:", req.headers.authorization);
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as an admin" });
  }
};
