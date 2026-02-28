import { PrismaClient, Role } from "@prisma/client";
import { Request } from "express";

export interface AuthUser {
  id: number;
  role: Role;
}

export interface AuthedRequest extends Request {
  prisma: PrismaClient;
  user?: AuthUser;
}











