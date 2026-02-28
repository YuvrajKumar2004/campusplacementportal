/*
  Warnings:

  - You are about to drop the column `eligibilityGapYearAllowed` on the `Opportunity` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Opportunity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobRole" TEXT NOT NULL,
    "tier" TEXT,
    "stipendCtc" TEXT,
    "eligibilityEnrollmentPrefix" TEXT,
    "eligibilityXPercent" REAL,
    "eligibilityXiPercent" REAL,
    "eligibilityActiveBacklogs" INTEGER,
    "eligibilityDeadBacklogs" INTEGER,
    "eligibilityCgpa" REAL,
    "eligibilityBranch" TEXT,
    "eligibilityMaxGapYears" INTEGER,
    "deadline" DATETIME,
    "skills" TEXT,
    "otherDetails" TEXT,
    "coordinatorId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Opportunity_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Opportunity" ("category", "companyName", "coordinatorId", "createdAt", "deadline", "eligibilityActiveBacklogs", "eligibilityBranch", "eligibilityCgpa", "eligibilityDeadBacklogs", "eligibilityEnrollmentPrefix", "eligibilityXPercent", "eligibilityXiPercent", "id", "jobRole", "otherDetails", "skills", "stipendCtc", "tier", "updatedAt") SELECT "category", "companyName", "coordinatorId", "createdAt", "deadline", "eligibilityActiveBacklogs", "eligibilityBranch", "eligibilityCgpa", "eligibilityDeadBacklogs", "eligibilityEnrollmentPrefix", "eligibilityXPercent", "eligibilityXiPercent", "id", "jobRole", "otherDetails", "skills", "stipendCtc", "tier", "updatedAt" FROM "Opportunity";
DROP TABLE "Opportunity";
ALTER TABLE "new_Opportunity" RENAME TO "Opportunity";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
