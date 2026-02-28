// @ts-nocheck
import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { AuthedRequest } from "../types";
import { OpportunityCategory, OpportunityTier, PlacementStatus, Role } from "@prisma/client";

const router = Router();

// Helper: Check if student profile meets eligibility for opportunity (for existing applications)
function checkEligibilityForProfile(profile: any, opp: any): { ok: boolean; reason: string } {
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
        .map((b: string) => b.trim().toUpperCase())
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

// Create new post
// @ts-ignore - AuthedRequest type is extended by middleware
router.post(
  "/posts",
  requireAuth([Role.COORDINATOR]),
  async (req: AuthedRequest, res) => {
    try {
      const coordinatorId = req.user!.id;
      const {
        category,
        companyName,
        jobRole,
        tier,
        stipendCtc,
        eligibilityEnrollmentPrefix,
        eligibilityXPercent,
        eligibilityXiPercent,
        eligibilityActiveBacklogs,
        eligibilityDeadBacklogs,
        eligibilityCgpa,
        eligibilityBranch,
        eligibilityMaxGapYears,
        deadline,
        skills,
        otherDetails,
        sharedFields,
      } = req.body;

      // Validate required fields
      if (!category || !companyName || !jobRole) {
        return res.status(400).json({ message: "Category, company name, and job role are required" });
      }

      // Convert empty strings to null for optional numeric fields
      const opp = await req.prisma.opportunity.create({
        data: {
          category,
          companyName,
          jobRole,
          tier: tier || null,
          stipendCtc: stipendCtc || null,
          eligibilityEnrollmentPrefix: eligibilityEnrollmentPrefix || null,
          eligibilityXPercent: eligibilityXPercent && eligibilityXPercent !== "" ? Number(eligibilityXPercent) : null,
          eligibilityXiPercent: eligibilityXiPercent && eligibilityXiPercent !== "" ? Number(eligibilityXiPercent) : null,
          eligibilityActiveBacklogs: eligibilityActiveBacklogs && eligibilityActiveBacklogs !== "" ? Number(eligibilityActiveBacklogs) : null,
          eligibilityDeadBacklogs: eligibilityDeadBacklogs && eligibilityDeadBacklogs !== "" ? Number(eligibilityDeadBacklogs) : null,
          eligibilityCgpa: eligibilityCgpa && eligibilityCgpa !== "" ? Number(eligibilityCgpa) : null,
          eligibilityBranch: eligibilityBranch || null,
          eligibilityMaxGapYears: eligibilityMaxGapYears && eligibilityMaxGapYears !== "" ? Number(eligibilityMaxGapYears) : null,
          deadline: deadline && deadline !== "" ? new Date(deadline) : null,
          skills: skills || null,
          otherDetails: otherDetails || null,
          coordinatorId,
          sharedFields: {
            create: (sharedFields || []).map((k: string) => ({ fieldKey: k })),
          },
        },
        include: { sharedFields: true },
      });
      return res.json(opp);
    } catch (error: any) {
      console.error("Error creating post:", error);
      return res.status(500).json({ 
        message: error.message || "Failed to create post. Please check all required fields are filled." 
      });
    }
  }
);

// My posts
// @ts-ignore - AuthedRequest type is extended by middleware
router.get(
  "/posts",
  requireAuth([Role.COORDINATOR]),
  async (req: AuthedRequest, res) => {
    const coordinatorId = req.user!.id;
    const posts = await req.prisma.opportunity.findMany({
      where: { coordinatorId },
      orderBy: { createdAt: "desc" },
    });
    return res.json(posts);
  }
);

// Update post
// @ts-ignore - AuthedRequest type is extended by middleware
router.put(
  "/posts/:id",
  requireAuth([Role.COORDINATOR]),
  async (req: AuthedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const {
        category,
        companyName,
        jobRole,
        tier,
        stipendCtc,
        eligibilityEnrollmentPrefix,
        eligibilityXPercent,
        eligibilityXiPercent,
        eligibilityActiveBacklogs,
        eligibilityDeadBacklogs,
        eligibilityCgpa,
        eligibilityBranch,
        eligibilityMaxGapYears,
        deadline,
        skills,
        otherDetails,
        sharedFields,
      } = req.body;

      // Validate required fields
      if (!category || !companyName || !jobRole) {
        return res.status(400).json({ message: "Category, company name, and job role are required" });
      }

      const opp = await req.prisma.opportunity.findUnique({ where: { id } });
      if (!opp) return res.status(404).json({ message: "Not found" });
      if (opp.coordinatorId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updated = await req.prisma.opportunity.update({
        where: { id },
        data: {
          category,
          companyName,
          jobRole,
          tier: tier || null,
          stipendCtc: stipendCtc || null,
          eligibilityEnrollmentPrefix: eligibilityEnrollmentPrefix || null,
          eligibilityXPercent: eligibilityXPercent && eligibilityXPercent !== "" ? Number(eligibilityXPercent) : null,
          eligibilityXiPercent: eligibilityXiPercent && eligibilityXiPercent !== "" ? Number(eligibilityXiPercent) : null,
          eligibilityActiveBacklogs: eligibilityActiveBacklogs && eligibilityActiveBacklogs !== "" ? Number(eligibilityActiveBacklogs) : null,
          eligibilityDeadBacklogs: eligibilityDeadBacklogs && eligibilityDeadBacklogs !== "" ? Number(eligibilityDeadBacklogs) : null,
          eligibilityCgpa: eligibilityCgpa && eligibilityCgpa !== "" ? Number(eligibilityCgpa) : null,
          eligibilityBranch: eligibilityBranch || null,
          eligibilityMaxGapYears: eligibilityMaxGapYears && eligibilityMaxGapYears !== "" ? Number(eligibilityMaxGapYears) : null,
          deadline: deadline && deadline !== "" ? new Date(deadline) : null,
          skills: skills || null,
          otherDetails: otherDetails || null,
          sharedFields: {
            deleteMany: {},
            create: (sharedFields || []).map((k: string) => ({ fieldKey: k })),
          },
        },
        include: { sharedFields: true },
      });

      // Check all existing applications and delete those that no longer meet eligibility
      const existingApplications = await req.prisma.application.findMany({
        where: { opportunityId: id },
        include: { student: true },
      });

      const ineligibleApplications: number[] = [];
      for (const app of existingApplications) {
        const eligibility = checkEligibilityForProfile(app.student, updated);
        if (!eligibility.ok) {
          ineligibleApplications.push(app.id);
        }
      }

      // Delete ineligible applications and their rounds
      if (ineligibleApplications.length > 0) {
        await req.prisma.applicationRound.deleteMany({
          where: { applicationId: { in: ineligibleApplications } },
        });
        await req.prisma.application.deleteMany({
          where: { id: { in: ineligibleApplications } },
        });
      }

      return res.json({
        ...updated,
        deletedApplicationsCount: ineligibleApplications.length,
      });
    } catch (error: any) {
      console.error("Error updating post:", error);
      return res.status(500).json({ 
        message: error.message || "Failed to update post. Please check all required fields are filled." 
      });
    }
  }
);

// Applied students for a post
// @ts-ignore - AuthedRequest type is extended by middleware
router.get(
  "/posts/:id/applications",
  requireAuth([Role.COORDINATOR]),
  async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    const opp = await req.prisma.opportunity.findUnique({
      where: { id },
      include: { sharedFields: true },
    });
    if (!opp) return res.status(404).json({ message: "Not found" });
    if (opp.coordinatorId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const apps = await req.prisma.application.findMany({
      where: { opportunityId: id },
      include: { 
        student: true,
        rounds: {
          orderBy: { roundNumber: 'asc' }
        }
      },
    });

    // Export-friendly data with only selected fields
    const rows = apps.map((a) => {
      const s = a.student as any;
      const row: any = {};
      for (const f of opp.sharedFields) {
        row[f.fieldKey] = s[f.fieldKey];
      }
      row.selectedCv = a.selectedCv;
      return row;
    });
    return res.json({ applications: apps, exportRows: rows });
  }
);

// Export as CSV
// @ts-ignore - AuthedRequest type is extended by middleware
router.get(
  "/posts/:id/export",
  requireAuth([Role.COORDINATOR]),
  async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    const opp = await req.prisma.opportunity.findUnique({
      where: { id },
      include: { sharedFields: true },
    });
    if (!opp) return res.status(404).end();
    if (opp.coordinatorId !== req.user!.id) {
      return res.status(403).end();
    }

    const apps = await req.prisma.application.findMany({
      where: { opportunityId: id },
      include: { student: true },
    });
    const fields = opp.sharedFields.map((f) => f.fieldKey).concat("selectedCv");
    const header = fields.join(",");
    const lines = apps.map((a) => {
      const s = a.student as any;
      return fields
        .map((f) => {
          const value = f === "selectedCv" ? a.selectedCv : s[f];
          const safe = value == null ? "" : String(value).replace(/"/g, '""');
          return `"${safe}"`;
        })
        .join(",");
    });
    const csv = [header, ...lines].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="opportunity-${id}-applications.csv"`
    );
    res.send(csv);
  }
);

// Update round results (upsert - update existing or create new)
// @ts-ignore - AuthedRequest type is extended by middleware
router.post(
  "/posts/:id/rounds",
  requireAuth([Role.COORDINATOR]),
  async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    const { roundNumber, description, date, centre, time, results } = req.body as {
      roundNumber: number;
      description?: string;
      date?: string;
      centre?: string;
      time?: string;
      results: { applicationId: number; status: string }[];
    };

    const opp = await req.prisma.opportunity.findUnique({
      where: { id },
    });
    if (!opp) return res.status(404).json({ message: "Not found" });
    if (opp.coordinatorId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const createdRounds = [];
    for (const r of results) {
      // Check if round already exists for this application
      const existing = await req.prisma.applicationRound.findFirst({
        where: {
          applicationId: r.applicationId,
          roundNumber,
        },
      });

      let round;
      if (existing) {
        // Update existing round
        round = await req.prisma.applicationRound.update({
          where: { id: existing.id },
          data: {
            description,
            date: date ? new Date(date) : null,
            centre,
            time,
            status: r.status,
          },
        });
      } else {
        // Create new round
        round = await req.prisma.applicationRound.create({
          data: {
            applicationId: r.applicationId,
            roundNumber,
            description,
            date: date ? new Date(date) : null,
            centre,
            time,
            status: r.status,
          },
        });
      }
      createdRounds.push(round);

      const app = await req.prisma.application.findUnique({
        where: { id: r.applicationId },
        include: { student: { include: { user: true } } },
      });
      if (app?.student.user) {
        await req.prisma.notification.create({
          data: {
            userId: app.student.user.id,
            title: `Round ${roundNumber} result`,
            body: `You are ${r.status} for ${opp.companyName}`,
          },
        });
      }
    }
    return res.json(createdRounds);
  }
);

// Get rounds summary for an opportunity
// @ts-ignore - AuthedRequest type is extended by middleware
router.get(
  "/posts/:id/rounds",
  requireAuth([Role.COORDINATOR]),
  async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    const opp = await req.prisma.opportunity.findUnique({
      where: { id },
    });
    if (!opp) return res.status(404).json({ message: "Not found" });
    if (opp.coordinatorId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Get all rounds for this opportunity's applications
    const apps = await req.prisma.application.findMany({
      where: { opportunityId: id },
      include: { rounds: true },
    });

    // Group rounds by roundNumber and get unique round info
    const roundsMap = new Map<number, { roundNumber: number; description?: string; date?: Date; centre?: string; time?: string }>();
    apps.forEach(app => {
      app.rounds.forEach(round => {
        if (!roundsMap.has(round.roundNumber)) {
          roundsMap.set(round.roundNumber, {
            roundNumber: round.roundNumber,
            description: round.description || undefined,
            date: round.date || undefined,
            centre: round.centre || undefined,
            time: round.time || undefined,
          });
        }
      });
    });

    const rounds = Array.from(roundsMap.values()).sort((a, b) => a.roundNumber - b.roundNumber);
    return res.json(rounds);
  }
);

export default router;



