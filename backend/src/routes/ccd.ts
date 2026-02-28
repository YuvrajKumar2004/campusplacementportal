// @ts-nocheck
import { Router } from "express";
import bcrypt from "bcryptjs";
import { requireAuth } from "../middleware/auth";
import { AuthedRequest } from "../types";
import { PlacementStatus, Role } from "@prisma/client";

const router = Router();

// CCD Admin: manage users, lock/unlock, edit profiles

// Dashboard (admin + member)
router.get(
  "/dashboard",
  requireAuth([Role.CCD_ADMIN, Role.CCD_MEMBER]),
  async (req: AuthedRequest, res) => {
    // Get total students count
    const totalStudents = await req.prisma.studentProfile.count();
    
    // Get placed students count (DREAM, STANDARD, or NORMAL placed)
    const placedStudents = await req.prisma.studentProfile.count({
      where: {
        placementStatus: {
          in: [PlacementStatus.DREAM_PLACED, PlacementStatus.STANDARD_PLACED, PlacementStatus.NORMAL_PLACED],
        },
      },
    });

    // Get placed counts by status
    const placedCounts = await req.prisma.studentProfile.groupBy({
      by: ["placementStatus"],
      _count: { _all: true },
    });

    // Get branch-wise placed students (only those who are placed)
    const branchPlacedCounts = await req.prisma.studentProfile.groupBy({
      by: ["branch"],
      where: {
        placementStatus: {
          in: [PlacementStatus.DREAM_PLACED, PlacementStatus.STANDARD_PLACED, PlacementStatus.NORMAL_PLACED],
        },
      },
      _count: { _all: true },
    });

    // Get total students per branch (for reference)
    const branchTotalCounts = await req.prisma.studentProfile.groupBy({
      by: ["branch"],
      _count: { _all: true },
    });

    // Get locked students count
    const lockedStudentsCount = await req.prisma.user.count({
      where: {
        role: Role.STUDENT,
        isLocked: true,
      },
    });

    return res.json({
      totalStudents,
      placedStudents,
      placedCounts,
      branchPlacedCounts,
      branchTotalCounts,
      lockedStudentsCount,
    });
  }
);

// CCD admin only
router.use(requireAuth([Role.CCD_ADMIN]));

// Create/update coordinator / CCD member
router.post("/users", async (req: AuthedRequest, res) => {
  const { loginId, password, role } = req.body as {
    loginId: string;
    password: string;
    role: Role;
  };
  if (!loginId || !password) {
    return res.status(400).json({ message: "Login ID and password are required" });
  }
  if (![Role.COORDINATOR, Role.CCD_MEMBER].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  
  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);
  
  const user = await req.prisma.user.upsert({
    where: { loginId },
    update: { passwordHash, role },
    create: { loginId, passwordHash, role },
  });
  await req.prisma.auditLog.create({
    data: {
      actorId: req.user!.id,
      action: "UPSERT_USER",
      meta: JSON.stringify({ loginId, role }),
    },
  });
  return res.json(user);
});

// Lock / unlock student by enrollment
router.post("/students/lock", async (req: AuthedRequest, res) => {
  const { enrollment, locked } = req.body as { enrollment: string; locked: boolean };

  if (!enrollment) {
    return res.status(400).json({ message: "Enrollment number is required" });
  }

  // Find student profile by enrollment
  const profile = await req.prisma.studentProfile.findUnique({
    where: { enrollment },
    include: { user: true },
  });

  if (!profile) {
    return res.status(404).json({ message: "Student not found with this enrollment number" });
  }

  if (profile.user.role !== Role.STUDENT) {
    return res.status(400).json({ message: "User is not a student" });
  }

  const updatedUser = await req.prisma.user.update({
    where: { id: profile.userId },
    data: { isLocked: locked },
  });

  await req.prisma.auditLog.create({
    data: {
      actorId: req.user!.id,
      action: locked ? "LOCK_STUDENT" : "UNLOCK_STUDENT",
      meta: JSON.stringify({ userId: profile.userId, enrollment }),
    },
  });

  return res.json(updatedUser);
});

// Get all locked students with enrollments
router.get("/students/locked", async (req: AuthedRequest, res) => {
  const lockedStudents = await req.prisma.user.findMany({
    where: {
      role: Role.STUDENT,
      isLocked: true,
    },
    include: {
      studentProfile: {
        select: {
          enrollment: true,
          branch: true,
          email: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  const lockedList = lockedStudents.map((user) => ({
    userId: user.id,
    loginId: user.loginId,
    enrollment: user.studentProfile?.enrollment || "N/A",
    branch: user.studentProfile?.branch || "N/A",
    email: user.studentProfile?.email || "N/A",
  }));

  return res.json(lockedList);
});

// List all students (for admin to see user IDs)
router.get("/students", async (req: AuthedRequest, res) => {
  const students = await req.prisma.user.findMany({
    where: { role: Role.STUDENT },
    include: {
      studentProfile: {
        select: {
          enrollment: true,
          branch: true,
          email: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  const studentsList = students.map((user) => ({
    userId: user.id,
    loginId: user.loginId,
    enrollment: user.studentProfile?.enrollment || "N/A",
    branch: user.studentProfile?.branch || "N/A",
    email: user.studentProfile?.email || "N/A",
    isLocked: user.isLocked,
  }));

  return res.json(studentsList);
});

// Search student by enrollment or loginId
router.get("/students/search", async (req: AuthedRequest, res) => {
  const { enrollment, loginId } = req.query as { enrollment?: string; loginId?: string };

  if (!enrollment && !loginId) {
    return res.status(400).json({ message: "Please provide either enrollment or loginId" });
  }

  let user;
  if (enrollment) {
    const profile = await req.prisma.studentProfile.findUnique({
      where: { enrollment },
      include: { user: true },
    });
    if (profile) {
      user = profile.user;
    }
  } else if (loginId) {
    user = await req.prisma.user.findUnique({
      where: { loginId },
    });
  }

  if (!user) {
    return res.status(404).json({ message: "Student not found" });
  }

  if (user.role !== Role.STUDENT) {
    return res.status(400).json({ message: "User is not a student" });
  }

  const profile = await req.prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });

  return res.json({
    userId: user.id,
    loginId: user.loginId,
    profile: profile,
  });
});

// View/edit any student profile (by userId)
router.get("/students/:userId/profile", async (req: AuthedRequest, res) => {
  const userId = Number(req.params.userId);
  
  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  // First check if user exists and is a student
  const user = await req.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role !== Role.STUDENT) {
    return res.status(400).json({ message: "User is not a student" });
  }

  const profile = await req.prisma.studentProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return res.status(404).json({ message: "Student profile not found for this user" });
  }

  return res.json(profile);
});

router.put("/students/:userId/profile", async (req: AuthedRequest, res) => {
  const userId = Number(req.params.userId);
  const {
    name,
    email,
    mobile,
    branch,
    cgpa,
    xPercentage,
    xiiPercentage,
    activeBacklogs,
    deadBacklogs,
    placementStatus,
    hasYearGap,
    yearGapDuration,
    cv1Url,
    cv2Url,
    cv3Url,
    tpoName,
    tpoEmail,
    tpoMobile,
    tnpName,
    tnpEmail,
    tnpMobile,
    icName,
    icEmail,
    icMobile,
    sgpaSem1,
    sgpaSem2,
    sgpaSem3,
    sgpaSem4,
    sgpaSem5,
    sgpaSem6,
    sgpaSem7,
    sgpaSem8,
  } = req.body;

  // Check if profile exists
  const existingProfile = await req.prisma.studentProfile.findUnique({
    where: { userId },
  });
  if (!existingProfile) {
    return res.status(404).json({ message: "Student profile not found" });
  }

  const updateData: any = {
    email,
    mobile,
    branch,
    cgpa: cgpa !== undefined ? cgpa : null,
    xPercentage: xPercentage !== undefined ? xPercentage : null,
    xiiPercentage: xiiPercentage !== undefined ? xiiPercentage : null,
    activeBacklogs: activeBacklogs !== undefined ? activeBacklogs : 0,
    deadBacklogs: deadBacklogs !== undefined ? deadBacklogs : 0,
    placementStatus,
    hasYearGap: hasYearGap !== undefined ? hasYearGap : false,
    yearGapDuration: yearGapDuration !== undefined ? yearGapDuration : null,
    cv1Url: cv1Url !== undefined ? cv1Url : null,
    cv2Url: cv2Url !== undefined ? cv2Url : null,
    cv3Url: cv3Url !== undefined ? cv3Url : null,
    tpoName: tpoName !== undefined ? tpoName : null,
    tpoEmail: tpoEmail !== undefined ? tpoEmail : null,
    tpoMobile: tpoMobile !== undefined ? tpoMobile : null,
    tnpName: tnpName !== undefined ? tnpName : null,
    tnpEmail: tnpEmail !== undefined ? tnpEmail : null,
    tnpMobile: tnpMobile !== undefined ? tnpMobile : null,
    icName: icName !== undefined ? icName : null,
    icEmail: icEmail !== undefined ? icEmail : null,
    icMobile: icMobile !== undefined ? icMobile : null,
    sgpaSem1: sgpaSem1 !== undefined ? sgpaSem1 : null,
    sgpaSem2: sgpaSem2 !== undefined ? sgpaSem2 : null,
    sgpaSem3: sgpaSem3 !== undefined ? sgpaSem3 : null,
    sgpaSem4: sgpaSem4 !== undefined ? sgpaSem4 : null,
    sgpaSem5: sgpaSem5 !== undefined ? sgpaSem5 : null,
    sgpaSem6: sgpaSem6 !== undefined ? sgpaSem6 : null,
    sgpaSem7: sgpaSem7 !== undefined ? sgpaSem7 : null,
    sgpaSem8: sgpaSem8 !== undefined ? sgpaSem8 : null,
  };

  // Add name field if provided (will be ignored if not in schema)
  if (name !== undefined) {
    updateData.name = name || null;
  }

  const profile = await req.prisma.studentProfile.update({
    where: { userId },
    data: updateData,
  });
  await req.prisma.auditLog.create({
    data: {
      actorId: req.user!.id,
      action: "UPDATE_STUDENT_PROFILE",
      meta: JSON.stringify({ userId }),
    },
  });
  return res.json(profile);
});

// Create or update student (upsert by enrollment)
router.post("/students", async (req: AuthedRequest, res) => {
  const {
    loginId,
    password,
    name,
    email,
    mobile,
    enrollment,
    branch,
    cgpa,
    xPercentage,
    xiiPercentage,
    activeBacklogs,
    deadBacklogs,
    placementStatus,
    hasYearGap,
    yearGapDuration,
    cv1Url,
    cv2Url,
    cv3Url,
    tpoName,
    tpoEmail,
    tpoMobile,
    tnpName,
    tnpEmail,
    tnpMobile,
    icName,
    icEmail,
    icMobile,
    sgpaSem1,
    sgpaSem2,
    sgpaSem3,
    sgpaSem4,
    sgpaSem5,
    sgpaSem6,
    sgpaSem7,
    sgpaSem8,
  } = req.body;

  if (!loginId || !password || !enrollment || !email || !mobile || !branch) {
    return res.status(400).json({ 
      message: "loginId, password, enrollment, email, mobile, and branch are required" 
    });
  }

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if student with this enrollment already exists
    const existingProfile = await req.prisma.studentProfile.findUnique({
      where: { enrollment },
      include: { user: true },
    });

    let user;
    if (existingProfile) {
      // Update existing user
      user = await req.prisma.user.update({
        where: { id: existingProfile.userId },
        data: { loginId, passwordHash, role: Role.STUDENT },
      });
    } else {
      // Check if user with loginId exists
      const existingUser = await req.prisma.user.findUnique({
        where: { loginId },
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          message: "User with this loginId already exists. Use different loginId or update existing student." 
        });
      }

      // Create new user
      user = await req.prisma.user.create({
        data: {
          loginId,
          passwordHash,
          role: Role.STUDENT,
        },
      });
    }

    // Upsert student profile
    const profileData: any = {
      userId: user.id,
      email,
      mobile,
      enrollment,
      branch,
      cgpa: cgpa !== undefined ? cgpa : null,
      xPercentage: xPercentage !== undefined ? xPercentage : null,
      xiiPercentage: xiiPercentage !== undefined ? xiiPercentage : null,
      activeBacklogs: activeBacklogs !== undefined ? activeBacklogs : 0,
      deadBacklogs: deadBacklogs !== undefined ? deadBacklogs : 0,
      placementStatus: (placementStatus && Object.values(PlacementStatus).includes(placementStatus as PlacementStatus))
        ? (placementStatus as PlacementStatus)
        : PlacementStatus.UNPLACED,
      hasYearGap: hasYearGap !== undefined ? hasYearGap : false,
      yearGapDuration: yearGapDuration !== undefined ? yearGapDuration : null,
      cv1Url: cv1Url || null,
      cv2Url: cv2Url || null,
      cv3Url: cv3Url || null,
      tpoName: tpoName || null,
      tpoEmail: tpoEmail || null,
      tpoMobile: tpoMobile || null,
      tnpName: tnpName || null,
      tnpEmail: tnpEmail || null,
      tnpMobile: tnpMobile || null,
      icName: icName || null,
      icEmail: icEmail || null,
      icMobile: icMobile || null,
      sgpaSem1: sgpaSem1 !== undefined ? sgpaSem1 : null,
      sgpaSem2: sgpaSem2 !== undefined ? sgpaSem2 : null,
      sgpaSem3: sgpaSem3 !== undefined ? sgpaSem3 : null,
      sgpaSem4: sgpaSem4 !== undefined ? sgpaSem4 : null,
      sgpaSem5: sgpaSem5 !== undefined ? sgpaSem5 : null,
      sgpaSem6: sgpaSem6 !== undefined ? sgpaSem6 : null,
      sgpaSem7: sgpaSem7 !== undefined ? sgpaSem7 : null,
      sgpaSem8: sgpaSem8 !== undefined ? sgpaSem8 : null,
    };

    // Add name if provided (will be ignored if not in schema)
    if (name !== undefined) {
      profileData.name = name || null;
    }

    const profile = await req.prisma.studentProfile.upsert({
      where: { enrollment },
      update: profileData,
      create: profileData,
    });

    await req.prisma.auditLog.create({
      data: {
        actorId: req.user!.id,
        action: existingProfile ? "UPDATE_STUDENT" : "CREATE_STUDENT",
        meta: JSON.stringify({ enrollment, loginId }),
      },
    });

    return res.json({ user, profile, action: existingProfile ? "updated" : "created" });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Enrollment or loginId already exists" });
    }
    return res.status(500).json({ message: error.message || "Failed to create/update student" });
  }
});

// Bulk create/update students from CSV
router.post("/students/bulk", async (req: AuthedRequest, res) => {
  const { students } = req.body as { students: any[] };

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ message: "Students array is required" });
  }

  const results = {
    created: 0,
    updated: 0,
    errors: [] as any[],
  };

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    try {
      if (!student.loginId || !student.password || !student.enrollment || !student.email || !student.mobile || !student.branch) {
        results.errors.push({
          row: i + 1,
          enrollment: student.enrollment || "N/A",
          error: "Missing required fields: loginId, password, enrollment, email, mobile, or branch",
        });
        continue;
      }

      const passwordHash = await bcrypt.hash(student.password, 10);

      // Check if enrollment exists
      const existingProfile = await req.prisma.studentProfile.findUnique({
        where: { enrollment: student.enrollment },
        include: { user: true },
      });

      let user;
      if (existingProfile) {
        // Update existing user
        user = await req.prisma.user.update({
          where: { id: existingProfile.userId },
          data: { loginId: student.loginId, passwordHash, role: Role.STUDENT },
        });
        results.updated++;
      } else {
        // Check if loginId exists
        const existingUser = await req.prisma.user.findUnique({
          where: { loginId: student.loginId },
        });
        
        if (existingUser) {
          results.errors.push({
            row: i + 1,
            enrollment: student.enrollment,
            error: `LoginId ${student.loginId} already exists`,
          });
          continue;
        }

        // Create new user
        user = await req.prisma.user.create({
          data: {
            loginId: student.loginId,
            passwordHash,
            role: Role.STUDENT,
          },
        });
        results.created++;
      }

      // Upsert profile
      const profileData: any = {
        userId: user.id,
        email: student.email,
        mobile: student.mobile,
        enrollment: student.enrollment,
        branch: student.branch,
        cgpa: student.cgpa ? Number(student.cgpa) : null,
        xPercentage: student.xPercentage ? Number(student.xPercentage) : null,
        xiiPercentage: student.xiiPercentage ? Number(student.xiiPercentage) : null,
        activeBacklogs: student.activeBacklogs ? Number(student.activeBacklogs) : 0,
        deadBacklogs: student.deadBacklogs ? Number(student.deadBacklogs) : 0,
        placementStatus: (student.placementStatus && Object.values(PlacementStatus).includes(student.placementStatus as PlacementStatus))
          ? (student.placementStatus as PlacementStatus)
          : PlacementStatus.UNPLACED,
        hasYearGap: student.hasYearGap === "true" || student.hasYearGap === true,
        yearGapDuration: student.yearGapDuration ? Number(student.yearGapDuration) : null,
        cv1Url: student.cv1Url || null,
        cv2Url: student.cv2Url || null,
        cv3Url: student.cv3Url || null,
        tpoName: student.tpoName || null,
        tpoEmail: student.tpoEmail || null,
        tpoMobile: student.tpoMobile || null,
        tnpName: student.tnpName || null,
        tnpEmail: student.tnpEmail || null,
        tnpMobile: student.tnpMobile || null,
        icName: student.icName || null,
        icEmail: student.icEmail || null,
        icMobile: student.icMobile || null,
        sgpaSem1: student.sgpaSem1 ? Number(student.sgpaSem1) : null,
        sgpaSem2: student.sgpaSem2 ? Number(student.sgpaSem2) : null,
        sgpaSem3: student.sgpaSem3 ? Number(student.sgpaSem3) : null,
        sgpaSem4: student.sgpaSem4 ? Number(student.sgpaSem4) : null,
        sgpaSem5: student.sgpaSem5 ? Number(student.sgpaSem5) : null,
        sgpaSem6: student.sgpaSem6 ? Number(student.sgpaSem6) : null,
        sgpaSem7: student.sgpaSem7 ? Number(student.sgpaSem7) : null,
        sgpaSem8: student.sgpaSem8 ? Number(student.sgpaSem8) : null,
      };

      if (student.name !== undefined) {
        profileData.name = student.name || null;
      }

      await req.prisma.studentProfile.upsert({
        where: { enrollment: student.enrollment },
        update: profileData,
        create: profileData,
      });
    } catch (error: any) {
      results.errors.push({
        row: i + 1,
        enrollment: student.enrollment || "N/A",
        error: error.message || "Unknown error",
      });
    }
  }

  await req.prisma.auditLog.create({
    data: {
      actorId: req.user!.id,
      action: "BULK_CREATE_STUDENTS",
      meta: JSON.stringify({ created: results.created, updated: results.updated, errors: results.errors.length }),
    },
  });

  return res.json(results);
});

export default router;







