import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthedRequest, AuthUser } from "../types";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function requireAuth(roles?: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
      if (roles && !roles.includes(payload.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      req.user = payload;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

export function signToken(user: AuthUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "8h" });
}











