import { Router } from "express";
import bcrypt from "bcryptjs";
import { signToken } from "../middleware/auth";
import { AuthedRequest } from "../types";

const router = Router();

router.post("/login", async (req: AuthedRequest, res) => {
  try {
    const { loginId, password, role } = req.body as {
      loginId: string;
      password: string;
      role: string;
    };

    if (!loginId || !password || !role) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await req.prisma.user.findUnique({
      where: { loginId },
    });
    
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare role (Prisma enum values are strings)
    if (user.role !== role) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({ id: user.id, role: user.role });
    return res.json({
      token,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;










