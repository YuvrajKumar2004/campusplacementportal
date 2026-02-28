import { PrismaClient, Role, PlacementStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // Helper to create user with password
  async function createUser(loginId: string, password: string, role: Role) {
    const passwordHash = await bcrypt.hash(password, 10);
    return prisma.user.upsert({
      where: { loginId },
      update: {},
      create: { loginId, passwordHash, role },
    });
  }

  // Students
  const s1User = await createUser("23ucs001", "student", Role.STUDENT);
  const s2User = await createUser("23uec001", "student", Role.STUDENT);
  const s3User = await createUser("23uee001", "student", Role.STUDENT);
  const s4User = await createUser("23uics001", "student", Role.STUDENT);

  await prisma.studentProfile.upsert({
    where: { userId: s1User.id },
    update: {},
    create: {
      userId: s1User.id,
      photoUrl: "photo",
      email: "a@nita.ac.in",
      mobile: "1234567890",
      enrollment: "23ucs001",
      branch: "CSE",
      sgpaSem1: 8,
      sgpaSem2: 8,
      sgpaSem3: 8,
      sgpaSem4: 8,
      sgpaSem5: 8,
      sgpaSem6: 0,
      sgpaSem7: 0,
      sgpaSem8: 0,
      cgpa: 8,
      xPercentage: 95,
      xiiPercentage: 90,
      hasYearGap: false,
      yearGapDuration: 0,
      activeBacklogs: 0,
      deadBacklogs: 0,
      cv1Url: "acv.com",
      cv2Url: null,
      cv3Url: null,
      tpoName: "csetpo",
      tpoEmail: "csetnp@nita.ac.in",
      tpoMobile: "1234567890",
      tnpName: "csetnp",
      tnpEmail: "csetnp@nita.ac.in",
      tnpMobile: "1234567890",
      icName: "cseic",
      icEmail: "csetnp@nita.ac.in",
      icMobile: "1234567890",
      placementStatus: PlacementStatus.DREAM_PLACED,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: s2User.id },
    update: {},
    create: {
      userId: s2User.id,
      photoUrl: "photo",
      email: "b@nita.ac.in",
      mobile: "1234567890",
      enrollment: "23uec001",
      branch: "ECE",
      sgpaSem1: 8,
      sgpaSem2: 8,
      sgpaSem3: 8,
      sgpaSem4: 8,
      sgpaSem5: 8,
      cgpa: 8.5,
      xPercentage: 95,
      xiiPercentage: 90,
      hasYearGap: true,
      yearGapDuration: 1,
      activeBacklogs: 0,
      deadBacklogs: 0,
      cv1Url: "bcv.com",
      tpoName: "ecetpo",
      tpoEmail: "ecetnp@nita.ac.in",
      tpoMobile: "1234567890",
      tnpName: "ecetnp",
      tnpEmail: "ecetnp@nita.ac.in",
      tnpMobile: "1234567890",
      icName: "eceic",
      icEmail: "ecetnp@nita.ac.in",
      icMobile: "1234567890",
      placementStatus: PlacementStatus.NORMAL_PLACED,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: s3User.id },
    update: {},
    create: {
      userId: s3User.id,
      photoUrl: "photo",
      email: "c@nita.ac.in",
      mobile: "1234567890",
      enrollment: "23uee001",
      branch: "EE",
      sgpaSem1: 8,
      sgpaSem2: 8,
      sgpaSem3: 8,
      sgpaSem4: 8,
      sgpaSem5: 8,
      cgpa: 9,
      xPercentage: 95,
      xiiPercentage: 90,
      hasYearGap: false,
      yearGapDuration: 0,
      activeBacklogs: 0,
      deadBacklogs: 0,
      cv1Url: "ccv.com",
      tpoName: "eetpo",
      tpoEmail: "eetnp@nita.ac.in",
      tpoMobile: "1234567890",
      tnpName: "eetnp",
      tnpEmail: "eetnp@nita.ac.in",
      tnpMobile: "1234567890",
      icName: "eeic",
      icEmail: "eetnp@nita.ac.in",
      icMobile: "1234567890",
      placementStatus: PlacementStatus.STANDARD_PLACED,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: s4User.id },
    update: {},
    create: {
      userId: s4User.id,
      photoUrl: "photo",
      email: "d@nita.ac.in",
      mobile: "1234567890",
      enrollment: "23uics001",
      branch: "CSE",
      sgpaSem1: 8,
      sgpaSem2: 8,
      sgpaSem3: 8,
      sgpaSem4: 8,
      sgpaSem5: 8,
      cgpa: 9.5,
      xPercentage: 95,
      xiiPercentage: 90,
      hasYearGap: false,
      yearGapDuration: 0,
      activeBacklogs: 0,
      deadBacklogs: 0,
      cv1Url: "dcv.com",
      tpoName: "icsetpo",
      tpoEmail: "icsetnp@nita.ac.in",
      tpoMobile: "1234567890",
      tnpName: "icsetnp",
      tnpEmail: "icsetnp@nita.ac.in",
      tnpMobile: "1234567890",
      icName: "icseic",
      icEmail: "icsetnp@nita.ac.in",
      icMobile: "1234567890",
      placementStatus: PlacementStatus.UNPLACED,
    },
  });

  // Coordinator & CCD accounts
  await createUser("tnp", "password", Role.COORDINATOR);
  await createUser("admin1", "password", Role.CCD_ADMIN);
  await createUser("ccd1", "password", Role.CCD_MEMBER);
}

main()
  .then(async () => {
    console.log("Seed completed");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });











