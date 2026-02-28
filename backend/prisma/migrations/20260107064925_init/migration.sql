-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "loginId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "photoUrl" TEXT,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "enrollment" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "sgpaSem1" REAL,
    "sgpaSem2" REAL,
    "sgpaSem3" REAL,
    "sgpaSem4" REAL,
    "sgpaSem5" REAL,
    "sgpaSem6" REAL,
    "sgpaSem7" REAL,
    "sgpaSem8" REAL,
    "cgpa" REAL,
    "xPercentage" REAL,
    "xiiPercentage" REAL,
    "hasYearGap" BOOLEAN NOT NULL DEFAULT false,
    "yearGapDuration" INTEGER,
    "activeBacklogs" INTEGER NOT NULL DEFAULT 0,
    "deadBacklogs" INTEGER NOT NULL DEFAULT 0,
    "cv1Url" TEXT,
    "cv2Url" TEXT,
    "cv3Url" TEXT,
    "tpoName" TEXT,
    "tpoEmail" TEXT,
    "tpoMobile" TEXT,
    "tnpName" TEXT,
    "tnpEmail" TEXT,
    "tnpMobile" TEXT,
    "icName" TEXT,
    "icEmail" TEXT,
    "icMobile" TEXT,
    "placementStatus" TEXT NOT NULL DEFAULT 'UNPLACED',
    CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Opportunity" (
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
    "eligibilityGapYearAllowed" BOOLEAN,
    "deadline" DATETIME,
    "skills" TEXT,
    "otherDetails" TEXT,
    "coordinatorId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Opportunity_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentSharedField" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "opportunityId" INTEGER NOT NULL,
    "fieldKey" TEXT NOT NULL,
    CONSTRAINT "StudentSharedField_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Application" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "opportunityId" INTEGER NOT NULL,
    "selectedCv" TEXT NOT NULL,
    "acceptedTerms" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Application_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Application_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationRound" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "applicationId" INTEGER NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "description" TEXT,
    "date" DATETIME,
    "centre" TEXT,
    "time" TEXT,
    "status" TEXT,
    CONSTRAINT "ApplicationRound_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "actorId" INTEGER,
    "action" TEXT NOT NULL,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_loginId_key" ON "User"("loginId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_enrollment_key" ON "StudentProfile"("enrollment");
