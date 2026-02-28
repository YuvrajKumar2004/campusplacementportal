// @ts-nocheck
import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { AuthedRequest } from "../types";
import { OpportunityCategory, OpportunityTier, PlacementStatus, Role } from "@prisma/client";

const router = Router();

// Get own profile
router.get(
  "/me",
  requireAuth([Role.STUDENT]),
  async (req: AuthedRequest, res) => {
    const userId = req.user!.id;
    const profile = await req.prisma.studentProfile.findUnique({
      where: { userId },
    });
    return res.json(profile);
  }
);

// Update CV links (student editable)
router.put(
  "/cv",
  requireAuth([Role.STUDENT]),
  async (req: AuthedRequest, res) => {
    const userId = req.user!.id;
    const { cv1Url, cv2Url, cv3Url } = req.body;
    const profile = await req.prisma.studentProfile.update({
      where: { userId },
      data: { cv1Url, cv2Url, cv3Url },
    });
    return res.json(profile);
  }
);

// Helper: eligibility & placement logic
async function isEligibleForOpportunity(
  prisma: AuthedRequest["prisma"],
  studentUserId: number,
  opportunityId: number
) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: studentUserId },
  });
  const user = await prisma.user.findUnique({ where: { id: studentUserId } });
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
  });

  if (!profile || !opp || !user) return { ok: false, reason: "Not found" };
  if (user.isLocked) return { ok: false, reason: "Locked by admin" };
  if (opp.category === OpportunityCategory.ON_CAMPUS) {
    if (opp.deadline && opp.deadline < new Date()) {
      return { ok: false, reason: "Deadline passed" };
    }
    if (opp.eligibilityEnrollmentPrefix) {
      if (!profile.enrollment.startsWith(opp.eligibilityEnrollmentPrefix)) {
        return { ok: false, reason: "Enrollment not eligible" };
      }
    }
    if (opp.eligibilityXPercent && (profile.xPercentage ?? 0) < opp.eligibilityXPercent) {
      return { ok: false, reason: "X percentage not eligible" };
    }
    if (opp.eligibilityXiPercent && (profile.xiiPercentage ?? 0) < opp.eligibilityXiPercent) {
      return { ok: false, reason: "XII percentage not eligible" };
    }
    if (
      typeof opp.eligibilityActiveBacklogs === "number" &&
      profile.activeBacklogs > opp.eligibilityActiveBacklogs
    ) {
      return { ok: false, reason: "Too many active backlogs" };
    }
    if (
      typeof opp.eligibilityDeadBacklogs === "number" &&
      profile.deadBacklogs > opp.eligibilityDeadBacklogs
    ) {
      return { ok: false, reason: "Too many dead backlogs" };
    }
    if (opp.eligibilityCgpa && (profile.cgpa ?? 0) < opp.eligibilityCgpa) {
      return { ok: false, reason: "CGPA not eligible" };
    }
    if (opp.eligibilityBranch) {
      const allowedBranches = opp.eligibilityBranch
        .split(",")
        .map((b) => b.trim().toUpperCase())
        .filter(Boolean);
      if (
        allowedBranches.length > 0 &&
        !allowedBranches.includes(profile.branch.toUpperCase())
      ) {
        return { ok: false, reason: "Branch not eligible" };
      }
    }
    if (
      typeof opp.eligibilityMaxGapYears === "number" &&
      (profile.hasYearGap ? profile.yearGapDuration || 0 : 0) > opp.eligibilityMaxGapYears
    ) {
      return { ok: false, reason: "Year gap exceeds allowed" };
    }

    // placement tier logic
    if (opp.tier) {
      switch (profile.placementStatus) {
        case PlacementStatus.DREAM_PLACED:
          return { ok: false, reason: "Already dream placed" };
        case PlacementStatus.STANDARD_PLACED:
          if (opp.tier !== OpportunityTier.DREAM) {
            return { ok: false, reason: "Only dream tier allowed" };
          }
          break;
        case PlacementStatus.NORMAL_PLACED:
          if (opp.tier === OpportunityTier.NORMAL) {
            return { ok: false, reason: "Standard or dream only" };
          }
          break;
        case PlacementStatus.UNPLACED:
        default:
          break;
      }
    }
  }
  return { ok: true, reason: "Eligible" };
}

// List visible on-campus opportunities (only eligible ones)
router.get(
  "/opportunities/on-campus",
  requireAuth([Role.STUDENT]),
  async (req: AuthedRequest, res) => {
    const studentUserId = req.user!.id;
    const all = await req.prisma.opportunity.findMany({
      where: { category: OpportunityCategory.ON_CAMPUS },
      orderBy: { createdAt: "desc" },
    });
    const filtered: any[] = [];
    for (const opp of all) {
      const { ok } = await isEligibleForOpportunity(req.prisma, studentUserId, opp.id);
      if (ok) filtered.push(opp);
    }
    return res.json(filtered);
  }
);

// List off-campus / hackathons
router.get(
  "/opportunities/off-campus",
  requireAuth([Role.STUDENT]),
  async (req: AuthedRequest, res) => {
    const off = await req.prisma.opportunity.findMany({
      where: { category: OpportunityCategory.OFF_CAMPUS },
      orderBy: { createdAt: "desc" },
    });
    return res.json(off);
  }
);

// Apply to opportunity
router.post(
  "/apply",
  requireAuth([Role.STUDENT]),
  async (req: AuthedRequest, res) => {
    const studentUserId = req.user!.id;
    const { opportunityId, selectedCv } = req.body as {
      opportunityId: number;
      selectedCv: "cv1Url" | "cv2Url" | "cv3Url";
    };

    const eligibility = await isEligibleForOpportunity(
      req.prisma,
      studentUserId,
      opportunityId
    );
    if (!eligibility.ok) {
      return res.status(400).json({ message: eligibility.reason });
    }

    // check duplicate - if exists, delete old application (one student one application)
    const profile = await req.prisma.studentProfile.findUnique({
      where: { userId: studentUserId },
    });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const existing = await req.prisma.application.findFirst({
      where: { studentId: profile.id, opportunityId },
    });
    if (existing) {
      // Delete old application and all its rounds
      await req.prisma.applicationRound.deleteMany({
        where: { applicationId: existing.id },
      });
      await req.prisma.application.delete({
        where: { id: existing.id },
      });
    }

    const cvValue = (profile as any)[selectedCv] as string | null;
    if (!cvValue) {
      return res.status(400).json({ message: "Selected CV is empty" });
    }

    const app = await req.prisma.application.create({
      data: {
        studentId: profile.id,
        opportunityId,
        selectedCv: cvValue,
        acceptedTerms: true,
      },
    });

    // simple notification stub
    await req.prisma.notification.create({
      data: {
        userId: studentUserId,
        title: "Application submitted",
        body: `You applied for opportunity ${opportunityId}`,
      },
    });

    return res.json(app);
  }
);

// List applied opportunities
router.get(
  "/applied",
  requireAuth([Role.STUDENT]),
  async (req: AuthedRequest, res) => {
    const profile = await req.prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    const apps = await req.prisma.application.findMany({
      where: { studentId: profile.id },
      include: {
        opportunity: true,
        rounds: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(apps);
  }
);

// Update application (only until deadline)
router.put(
  "/applied/:applicationId",
  requireAuth([Role.STUDENT]),
  async (req: AuthedRequest, res) => {
    const studentUserId = req.user!.id;
    const applicationId = Number(req.params.applicationId);
    const { selectedCv } = req.body as {
      selectedCv: "cv1Url" | "cv2Url" | "cv3Url";
    };

    const profile = await req.prisma.studentProfile.findUnique({
      where: { userId: studentUserId },
    });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const application = await req.prisma.application.findUnique({
      where: { id: applicationId },
      include: { opportunity: true },
    });

    if (!application || application.studentId !== profile.id) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Check deadline
    if (application.opportunity.deadline && new Date(application.opportunity.deadline) < new Date()) {
      return res.status(400).json({ message: "Deadline has passed" });
    }

    const cvValue = (profile as any)[selectedCv] as string | null;
    if (!cvValue) {
      return res.status(400).json({ message: "Selected CV is empty" });
    }

    const updated = await req.prisma.application.update({
      where: { id: applicationId },
      data: { selectedCv: cvValue },
      include: {
        opportunity: true,
        rounds: true,
      },
    });

    return res.json(updated);
  }
);

// Notifications (view-only)
router.get(
  "/notifications",
  requireAuth([Role.STUDENT]),
  async (req: AuthedRequest, res) => {
    const notes = await req.prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    return res.json(notes);
  }
);

export default router;


