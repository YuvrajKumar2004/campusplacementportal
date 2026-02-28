import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  console.log("Verifying cleanup results...\n");

  try {
    // Check what was deleted
    const roundsCount = await prisma.applicationRound.count();
    const applicationsCount = await prisma.application.count();
    const coordinatorOpportunitiesCount = await prisma.opportunity.count({
      where: { coordinatorId: { not: null } },
    });
    const notificationsCount = await prisma.notification.count();

    // Check what should remain
    const usersCount = await prisma.user.count();
    const studentProfilesCount = await prisma.studentProfile.count();
    const allOpportunitiesCount = await prisma.opportunity.count();

    console.log("✅ DELETED DATA (should be 0):");
    console.log(`   Round results: ${roundsCount}`);
    console.log(`   Applications: ${applicationsCount}`);
    console.log(`   Coordinator opportunities: ${coordinatorOpportunitiesCount}`);
    console.log(`   Notifications: ${notificationsCount}`);

    console.log("\n✅ PRESERVED DATA (should remain):");
    console.log(`   User accounts: ${usersCount}`);
    console.log(`   Student profiles: ${studentProfilesCount}`);
    console.log(`   Total opportunities (including off-campus): ${allOpportunitiesCount}`);

    if (
      roundsCount === 0 &&
      applicationsCount === 0 &&
      coordinatorOpportunitiesCount === 0 &&
      notificationsCount === 0 &&
      usersCount > 0 &&
      studentProfilesCount > 0
    ) {
      console.log("\n✅ Verification passed! Cleanup was successful.");
    } else {
      console.log("\n⚠️  Verification shows some unexpected results.");
    }
  } catch (error) {
    console.error("❌ Error during verification:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verify()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  });





