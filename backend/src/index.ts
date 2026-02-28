import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { PrismaClient, Role } from "@prisma/client";
import authRouter from "./routes/auth";
import studentRouter from "./routes/student";
import coordinatorRouter from "./routes/coordinator";
import ccdRouter from "./routes/ccd";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// simple health
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// attach prisma to request via middleware
app.use((req, _res, next) => {
  // @ts-expect-error custom
  req.prisma = prisma;
  next();
});

app.use("/api/auth", authRouter);
app.use("/api/student", studentRouter);
app.use("/api/coordinator", coordinatorRouter);
app.use("/api/ccd", ccdRouter);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`NITA Placement backend running on port ${PORT}`);
});











