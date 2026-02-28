import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanup() {
  console.log("Starting database cleanup...");

  try {
    // 1. Delete all round results (ApplicationRound)
    console.log("Deleting all round results...");
    const deletedRounds = await prisma.applicationRound.deleteMany({});
    console.log(`Deleted ${deletedRounds.count} round results`);

    // 2. Delete all student applications (Application)
    console.log("Deleting all student applications...");
    const deletedApplications = await prisma.application.deleteMany({});
    console.log(`Deleted ${deletedApplications.count} applications`);

    // 3. Get all coordinator opportunity IDs before deletion
    console.log("Finding coordinator opportunities...");
    const coordinatorOpportunities = await prisma.opportunity.findMany({
      where: {
        coordinatorId: {
          not: null,
        },
      },
      select: {
        id: true,
      },
    });
    const opportunityIds = coordinatorOpportunities.map((opp) => opp.id);
    console.log(`Found ${opportunityIds.length} coordinator opportunities`);

    // 4. Delete StudentSharedField records for coordinator opportunities
    if (opportunityIds.length > 0) {
      console.log("Deleting shared fields for coordinator opportunities...");
      const deletedSharedFields = await prisma.studentSharedField.deleteMany({
        where: {
          opportunityId: {
            in: opportunityIds,
          },
        },
      });
      console.log(`Deleted ${deletedSharedFields.count} shared field records`);
    }

    // 5. Delete all coordinator posts (Opportunity where coordinatorId is not null)
    console.log("Deleting all coordinator posts...");
    const deletedOpportunities = await prisma.opportunity.deleteMany({
      where: {
        coordinatorId: {
          not: null,
        },
      },
    });
    console.log(`Deleted ${deletedOpportunities.count} coordinator opportunities`);

    // 6. Delete all notifications
    console.log("Deleting all notifications...");
    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`Deleted ${deletedNotifications.count} notifications`);

    console.log("\n✅ Cleanup completed successfully!");
    console.log("\nSummary:");
    console.log(`- Round results deleted: ${deletedRounds.count}`);
    console.log(`- Applications deleted: ${deletedApplications.count}`);
    console.log(`- Coordinator opportunities deleted: ${deletedOpportunities.count}`);
    console.log(`- Notifications deleted: ${deletedNotifications.count}`);
    console.log("\nAll user accounts, student profiles, and credentials remain intact.");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanup()
  .then(() => {
    console.log("\nCleanup script finished.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nCleanup script failed:", error);
    process.exit(1);
  });





