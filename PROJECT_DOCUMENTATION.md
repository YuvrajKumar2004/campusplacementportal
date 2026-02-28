# NITA Placement Web App - Complete Documentation

## 📋 Table of Contents
1. [Tech Stack](#tech-stack)
2. [System Architecture](#system-architecture)
3. [Workflows](#workflows)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.19.0
- **Language**: TypeScript 5.6.0
- **ORM**: Prisma 6.0.0
- **Database**: SQLite (via Prisma)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3
- **Security**: Helmet 8.0.0, CORS 2.8.5
- **Logging**: Morgan 1.10.0
- **Environment**: dotenv 16.4.0
- **Dev Tools**: 
  - ts-node-dev 2.0.0 (hot reload)
  - ts-node 10.9.2

### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.6.2
- **Build Tool**: Vite 5.4.8
- **Routing**: React Router DOM 6.26.2
- **HTTP Client**: Axios 1.7.4
- **Styling**: Tailwind CSS 3.4.14
- **PostCSS**: 8.4.47
- **Autoprefixer**: 10.4.20

### Development Environment
- **Package Manager**: npm
- **Version Control**: Git
- **OS**: Windows 10/11 (tested), Linux/macOS compatible
- **Node.js**: Version 18+ recommended
- **Ports**: 
  - Backend: 4000 (configurable via PORT env var)
  - Frontend: 5173 (Vite default, auto-assigned if busy)
- **TypeScript**: Strict mode enabled, type checking on build
- **Hot Reload**: 
  - Backend: ts-node-dev with respawn
  - Frontend: Vite HMR (Hot Module Replacement)

---

## 🏗️ System Architecture

### Architecture Pattern
- **Backend**: RESTful API with Express.js
- **Frontend**: Single Page Application (SPA) with React Router
- **Database**: SQLite with Prisma ORM (Object-Relational Mapping)
- **Authentication**: JWT (JSON Web Tokens) stateless authentication
- **State Management**: React hooks (useState, useEffect) - no external state library
- **Styling**: Utility-first CSS with Tailwind CSS

### Request Flow
1. **User Action** → Frontend component
2. **API Call** → Axios client (`lib/api.ts`) with JWT token
3. **Middleware** → Authentication check (`requireAuth`)
4. **Route Handler** → Business logic in route files
5. **Database** → Prisma Client queries
6. **Response** → JSON data back to frontend
7. **UI Update** → React state update, re-render

### Project Structure
```
nita project/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   ├── seed.ts             # Initial data seeding
│   │   ├── cleanup.ts           # Database cleanup script
│   │   └── verify-cleanup.ts    # Cleanup verification script
│   ├── src/
│   │   ├── index.ts            # Express server entry
│   │   ├── types.ts            # TypeScript types (AuthedRequest, etc.)
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT authentication middleware
│   │   └── routes/
│   │       ├── auth.ts         # Login endpoints
│   │       ├── student.ts      # Student module APIs
│   │       ├── coordinator.ts  # Coordinator module APIs
│   │       └── ccd.ts          # CCD Admin/Member APIs
│   ├── dist/                   # Compiled JavaScript (production)
│   ├── dev.db                  # SQLite database file
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── main.tsx            # React entry point
    │   ├── App.tsx             # Main router
    │   ├── index.css           # Tailwind imports
    │   ├── lib/
    │   │   └── api.ts          # Axios client with auth
    │   ├── components/
    │   │   └── TopBar.tsx      # Shared navigation bar
    │   └── pages/
    │       ├── LoginPage.tsx           # Login UI
    │       ├── StudentDashboard.tsx    # Student interface
    │       ├── CoordinatorDashboard.tsx # Coordinator interface
    │       └── CcdDashboard.tsx        # CCD Admin/Member interface
    ├── dist/                   # Production build output
    ├── package.json
    ├── vite.config.ts          # Vite configuration
    └── tsconfig.json
```

### Data Flow Patterns

#### Authentication Flow
```
Login → JWT Token → localStorage → Axios Interceptor → API Headers
```

#### Application Flow
```
Student → View Opportunities → Check Eligibility → Apply → Create Application → Notify
```

#### Round Management Flow
```
Coordinator → View Applications → Create/Update Round → Mark Results → Notify Students
```

#### Student Management Flow
```
CCD Admin → Search by Enrollment → View/Edit Profile → Update Database → Audit Log
```

---

## 🔄 Workflows

### 1. Authentication & Authorization Workflow

#### Login Flow
1. User selects role (Student/Coordinator/CCD Admin/CCD Member)
2. Enters loginId and password
3. Backend validates:
   - User exists with matching loginId
   - Role matches selected role
   - Password hash matches (bcrypt)
4. JWT token generated and returned
5. Token stored in localStorage
6. Redirect to role-specific dashboard

#### Role-Based Access Control (RBAC)
- **Student**: Can view profile, apply to opportunities, view applications
- **Coordinator**: Can create/edit posts, view applications, export CSV, update rounds
- **CCD Admin**: Full access - manage users, lock students, edit profiles, view dashboard
- **CCD Member**: Read-only dashboard access

---

### 2. Student Module Workflows

#### Profile View Workflow
1. Student logs in → Dashboard loads
2. Profile tab displays:
   - Personal info (email, mobile, enrollment, branch)
   - Academic records (SGPA sem 1-8, CGPA, X/XII %)
   - Backlog info (active/dead)
   - Year gap status
   - CV links (CV1, CV2, CV3) - **Editable by student**
   - TPO/TnP/IC contact details
   - Placement status
3. Profile is **view-only** except CV links (student can edit)

#### CV Editing Workflow
1. Student navigates to Profile section
2. Sees CV1, CV2, CV3 input fields (editable)
3. Updates Google Drive links
4. Clicks "Save CV links"
5. Backend updates via `PUT /api/student/cv`
6. Changes saved to database

#### On-Campus Opportunities Workflow
1. Student views "On-Campus Opportunities" tab
2. Backend filters opportunities:
   - Only shows eligible opportunities
   - Eligibility checks:
     - Enrollment prefix match
     - X percentage ≥ required
     - XII percentage ≥ required
     - Active backlogs ≤ max allowed
     - Dead backlogs ≤ max allowed
     - CGPA ≥ required
     - Branch in allowed list (comma-separated)
     - Year gap ≤ max allowed (if specified)
     - Deadline not passed
     - Student not locked
     - Placement status tier logic:
       - Dream Placed → Cannot apply
       - Standard Placed → Can apply Dream only
       - Normal Placed → Can apply Dream + Standard
       - Unplaced → Can apply all tiers
3. Student selects opportunity
4. Chooses CV (CV1/CV2/CV3)
5. Accepts Terms & Conditions
6. Clicks "Apply"
7. Backend validates eligibility again (server-side enforcement)
8. **One Student, One Application Rule**: If student already applied to this opportunity, old application and all its rounds are deleted before creating new one
9. Creates Application record
10. Sends notification to student
11. Application appears in "Applied" section

#### Applied Section Workflow
1. Student views "Applied" tab
2. Lists all applications with:
   - Company name, job role
   - Selected CV
   - Round-wise status:
     - Round 1: date, centre, time, status (SELECTED/REJECTED/PENDING)
     - Round 2, 3... (dynamic as added by coordinator)

#### Off-Campus/Hackathons Workflow
1. Student views "Off-Campus Opportunities" tab
2. Lists all off-campus posts
3. Shows title, description, external link
4. Clicking redirects to external website

#### Notifications Workflow
1. Student views "Notifications" tab
2. Displays:
   - Application status updates
   - Round selection/rejection updates
   - System/admin notifications
3. Currently **view-only** (non-functional)

---

### 3. Coordinator Module Workflows

#### Create New Post Workflow
1. Coordinator logs in → Dashboard loads
2. Navigates to "New Post" section
3. Fills form:
   - **Category**: On-Campus / Off-Campus
   - **Company name**
   - **Job role**
   - **Tier**: Dream / Standard / Normal
   - **Stipend/CTC**
   - **Eligibility criteria**:
     - Enrollment prefix (e.g., "23")
     - X percentage minimum
     - XII percentage minimum
     - Active backlogs maximum
     - Dead backlogs maximum
     - CGPA minimum
     - **Branch** (comma-separated: "CSE,ECE,EE" or blank for all)
     - **Max gap years allowed** (integer, blank = no check)
   - **Deadline** (date)
   - **Skills required**
   - **Other details**
4. **Student Data Selection**:
   - Selects which fields to share with company:
     - Photo, email, mobile, enrollment, branch
     - SGPA sem 1-8, CGPA, X/XII %
     - Year gap, backlogs
     - CV links
5. Clicks "Post"
6. Backend creates Opportunity record
7. Creates StudentSharedField records for selected fields
8. Post appears in "My Posts"

#### Edit Post Workflow
1. Coordinator views "My Posts"
2. Clicks "Edit" on a post
3. Form pre-fills with existing data
4. Coordinator modifies fields (including eligibility criteria)
5. Clicks "Post" (updates existing)
6. Backend updates Opportunity record
7. **Eligibility Re-validation**: 
   - Backend checks all existing applications for this opportunity
   - If any student no longer meets updated eligibility criteria, their application is deleted
   - Ensures only eligible students remain in the application pool

#### View Applications Workflow
1. Coordinator clicks "View Applications" on a post
2. Backend fetches:
   - All applications for that opportunity
   - Student profiles (only shared fields)
   - Export-ready rows (CSV format)
3. Displays:
   - Student enrollment, branch
   - Selected CV
   - Application date

#### Export CSV Workflow
1. Coordinator clicks "Export CSV" on a post
2. Frontend calls API with auth token
3. Backend generates CSV:
   - Headers: selected shared fields
   - Rows: one per application with student data
4. Browser downloads CSV file

#### Round Management Workflow
1. Coordinator views applications for a post
2. **View Existing Rounds**: Displays all rounds with:
   - Round number
   - Description
   - Date, centre, time
   - Status for each application
3. **Create New Round**:
   - Clicks "+ Add New Round" button
   - Fills form: round number, description, date, centre, time
   - Selects applications (checkboxes or "Select All")
   - Marks selected applications as SELECTED/REJECTED
   - Submits to create round
4. **Update Existing Round**:
   - Selects applications for an existing round
   - Marks as SELECTED/REJECTED
   - Backend upserts ApplicationRound records (updates if exists, creates if new)
5. Backend creates/updates ApplicationRound records with description, date, centre, time
6. Notifications sent to students with round results

---

### 4. CCD Module Workflows

#### CCD Admin Dashboard Workflow
1. CCD Admin logs in → Dashboard loads
2. Displays comprehensive statistics:
   - **Total Students**: Count of all students in the system
   - **Placed Students**: Count of unique students placed (Dream, Standard, or Normal)
   - **Placement Percentage**: (Placed / Total) × 100
   - **Placed Students by Status**:
     - Dream Placed count
     - Standard Placed count
     - Normal Placed count
     - Unplaced count
   - **Branch-wise Statistics**:
     - Bar graph showing placement percentage per branch
     - Placed count per branch
     - Total count per branch
   - **Locked Students Count**: Number of students currently locked from applying

#### Create/Update Coordinator/CCD Member Workflow
1. CCD Admin navigates to user management
2. Enters:
   - Login ID
   - Password (plain text - backend hashes it)
   - Role (Coordinator or CCD Member)
3. Clicks "Create/Update"
4. Backend:
   - Hashes password with bcrypt
   - Upserts User record (updates if loginId exists, creates if new)
5. Audit log created

#### Add Students Workflow (Manual)
1. CCD Admin navigates to "Add Students" section
2. Expands "Add / Update Single Student" form
3. Fills required fields:
   - Login ID, Password, Enrollment, Email, Mobile, Branch
4. Optionally fills:
   - Name, CGPA, X/XII percentages, backlogs
   - Placement status, year gap info
   - CV URLs, TPO/TNP/IC details
   - SGPA sem 1-8
5. Clicks "Save Student"
6. Backend:
   - Checks if enrollment exists
   - If exists: Updates existing student and user
   - If new: Creates new user and student profile
   - Hashes password
   - Upserts by enrollment (enrollment is unique)
7. Success message shows "created" or "updated"
8. Dashboard stats refresh

#### Bulk Add Students from CSV Workflow
1. CCD Admin navigates to "Add Students" section
2. **CSV Upload Section**:
   - Selects CSV file (must have .csv extension)
   - CSV should include columns: loginId, password, name, email, mobile, enrollment, branch, and other optional fields
3. Clicks "Upload CSV"
4. Frontend:
   - Parses CSV file (handles quoted fields and commas)
   - Validates format
   - Sends array of student objects to backend
5. Backend:
   - Processes each student row
   - For each student:
     - Checks if enrollment exists
     - If exists: Updates existing student
     - If new: Creates new user and profile
     - Hashes passwords
   - Returns summary: created count, updated count, errors
6. Frontend displays results:
   - Success: "X created, Y updated"
   - Errors: Lists row numbers and error messages
7. Dashboard stats refresh

#### Database Cleanup Workflow (One-time Script)
1. Admin runs cleanup script: `npx ts-node backend/prisma/cleanup.ts`
2. Script performs:
   - Deletes all ApplicationRound records (round results)
   - Deletes all Application records (student applications)
   - Deletes all StudentSharedField records for coordinator opportunities
   - Deletes all Opportunity records created by Coordinators
   - Deletes all Notification records
3. **Preserves**:
   - All User accounts and login credentials
   - All StudentProfile records
   - Database schema (no changes)
4. Verification script: `npx ts-node backend/prisma/verify-cleanup.ts`
5. System behaves like fresh semester reset with existing users intact

#### Lock/Unlock Student Workflow
1. CCD Admin enters student **enrollment number** (e.g., "23CS001")
2. Selects lock/unlock action from dropdown
3. Clicks "Update"
4. Backend:
   - Finds user by enrollment number
   - Updates `User.isLocked` status
   - Validates enrollment exists
5. Locked students **cannot apply** to opportunities (eligibility check fails)
6. **View Locked Students**: Button to show all locked students with enrollment, branch, email, and user ID
7. Audit log created

#### View/Edit Student Profile Workflow
1. CCD Admin searches student by **enrollment number** (primary method)
2. Can also search by loginId
3. Views full profile with all fields:
   - **Personal**: Name, email, mobile, enrollment, branch
   - **Academic**: SGPA sem 1-8, CGPA, X/XII percentages
   - **Backlogs**: Active and dead backlogs
   - **Year Gap**: Has gap, duration
   - **CVs**: CV1, CV2, CV3 URLs
   - **TPO Details**: Name, email, mobile
   - **TNP Details**: Name, email, mobile
   - **IC Details**: Name, email, mobile
   - **Placement Status**: Dream/Standard/Normal/Unplaced
4. Can edit any field
5. Saves changes
6. Backend updates StudentProfile with all fields (handles null/undefined safely)
7. Audit log created

#### CCD Member Dashboard Workflow
1. CCD Member logs in → Dashboard loads
2. **Read-only** view of:
   - Placed students statistics
   - Branch-wise statistics
3. No edit capabilities

---

### 5. Eligibility Enforcement Workflow (Critical)

#### Server-Side Eligibility Check (On Apply)
1. Student clicks "Apply" on opportunity
2. Backend runs `isEligibleForOpportunity()`:
   - Checks user is not locked
   - Validates enrollment prefix
   - Validates X/XII percentages
   - Validates backlogs (active/dead)
   - Validates CGPA
   - Validates branch (checks if in comma-separated list)
   - Validates year gap (if max specified, checks gap duration ≤ max)
   - Validates deadline not passed
   - Validates placement status tier logic:
     - Dream Placed → Cannot apply
     - Standard Placed → Can apply Dream only
     - Normal Placed → Can apply Dream + Standard
     - Unplaced → Can apply all tiers
3. If any check fails → Returns error message
4. If all pass → Creates application

#### Placement Status Tier Logic
- **Dream Placed**: Cannot apply to any opportunity
- **Standard Placed**: Can apply to Dream tier only
- **Normal Placed**: Can apply to Dream + Standard tiers
- **Unplaced**: Can apply to all tiers (Dream, Standard, Normal)

---

### 6. Notification System Workflow

#### Notification Creation
1. Application submitted → Notification created
2. Round result updated → Notification created
3. Admin action → Notification created (stub)

#### Notification Display
1. Student views "Notifications" tab
2. Lists all notifications (newest first)
3. Shows title, body, timestamp
4. Currently **view-only** (no read/unread toggle)

---

### 7. Audit Logging Workflow

#### Logged Actions
- **UPSERT_USER**: Creating/updating coordinator/CCD member
- **LOCK_STUDENT**: Locking a student
- **UNLOCK_STUDENT**: Unlocking a student
- **UPDATE_STUDENT_PROFILE**: Editing student profile

#### Audit Log Structure
- Actor ID (who performed action)
- Action type
- Metadata (JSON string)
- Timestamp

---

## 🗄️ Database Schema

### Models

#### User
- `id` (Int, PK)
- `loginId` (String, unique)
- `passwordHash` (String)
- `role` (Role enum: STUDENT, COORDINATOR, CCD_ADMIN, CCD_MEMBER)
- `isLocked` (Boolean)
- Relations: StudentProfile, Opportunity[], Notification[], AuditLog[]

#### StudentProfile
- `id` (Int, PK)
- `userId` (Int, FK → User, unique)
- `enrollment` (String, unique) - Primary identifier for student lookup
- Personal: `photoUrl`, `email`, `mobile`, `branch`
- Academic: `sgpaSem1-8` (Float, nullable), `cgpa` (Float, nullable), `xPercentage` (Float, nullable), `xiiPercentage` (Float, nullable)
- Backlogs: `activeBacklogs` (Int, default 0), `deadBacklogs` (Int, default 0)
- Gap: `hasYearGap` (Boolean, default false), `yearGapDuration` (Int, nullable)
- CVs: `cv1Url`, `cv2Url`, `cv3Url` (String, nullable)
- Contacts: 
  - `tpoName/Email/Mobile` (String, nullable)
  - `tnpName/Email/Mobile` (String, nullable)
  - `icName/Email/Mobile` (String, nullable)
- `placementStatus` (PlacementStatus enum, default UNPLACED)
- Relations: User (one-to-one), Application[] (one-to-many)

#### Opportunity
- `id` (Int, PK)
- `category` (OpportunityCategory: ON_CAMPUS, OFF_CAMPUS)
- `companyName`, `jobRole`, `tier` (OpportunityTier: DREAM, STANDARD, NORMAL)
- `stipendCtc`, `deadline`, `skills`, `otherDetails`
- Eligibility: `eligibilityEnrollmentPrefix`, `eligibilityXPercent`, `eligibilityXiPercent`, `eligibilityActiveBacklogs`, `eligibilityDeadBacklogs`, `eligibilityCgpa`, `eligibilityBranch` (comma-separated), `eligibilityMaxGapYears`
- Relations: StudentSharedField[], Application[], User (coordinator)

#### Application
- `id` (Int, PK)
- `studentId` (FK → StudentProfile)
- `opportunityId` (FK → Opportunity)
- `selectedCv` (String)
- `acceptedTerms` (Boolean)
- `createdAt` (DateTime)
- Relations: StudentProfile, Opportunity, ApplicationRound[]

#### ApplicationRound
- `id` (Int, PK)
- `applicationId` (FK → Application)
- `roundNumber` (Int) - Round identifier (1, 2, 3, etc.)
- `description` (String, nullable) - Round description (e.g., "Technical Interview", "HR Round")
- `date` (DateTime, nullable) - Round date
- `centre` (String, nullable) - Venue/centre location
- `time` (String, nullable) - Round time
- `status` (String, nullable) - SELECTED, REJECTED, or PENDING
- Relations: Application (many-to-one)

#### Notification
- `id` (Int, PK)
- `userId` (FK → User)
- `title`, `body`
- `createdAt` (DateTime)
- `isRead` (Boolean)

#### AuditLog
- `id` (Int, PK)
- `actorId` (FK → User, nullable)
- `action` (String)
- `meta` (String, JSON)
- `createdAt` (DateTime)

#### StudentSharedField
- `id` (Int, PK)
- `opportunityId` (FK → Opportunity)
- `fieldKey` (String, e.g., "email", "cv1Url")

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login (loginId, password, role) → Returns JWT token

### Student Routes (`/api/student`)
- `GET /me` - Get own profile
- `PUT /cv` - Update CV links (cv1Url, cv2Url, cv3Url)
- `GET /opportunities/on-campus` - List eligible on-campus opportunities
- `GET /opportunities/off-campus` - List off-campus opportunities
- `POST /apply` - Apply to opportunity (opportunityId, selectedCv)
  - Implements "one student, one application" rule
  - If application exists, deletes old application and all its rounds
  - Creates new application
- `GET /applied` - List applied opportunities with rounds
  - Includes round details: description, date, centre, time, status
- `GET /notifications` - List notifications

### Coordinator Routes (`/api/coordinator`)
- `GET /posts` - List own posts
- `POST /posts` - Create new post
- `PUT /posts/:id` - Update post (re-validates eligibility, deletes ineligible applications)
- `GET /posts/:id/applications` - Get applications for post (includes rounds data)
- `GET /posts/:id/export` - Export CSV (with auth)
- `POST /posts/:id/rounds` - Create/update round results (upsert by roundNumber and applicationId)
- `GET /posts/:id/rounds` - Get all rounds summary for opportunity

### CCD Routes (`/api/ccd`)
- `GET /dashboard` - Get statistics (admin + member)
  - Returns: totalStudents, placedStudents, placedCounts, branchPlacedCounts, branchTotalCounts, lockedStudentsCount
- `POST /users` - Create/update coordinator/CCD member (admin only)
  - Accepts: loginId, password (plain text), role
  - Backend hashes password before storing
- `POST /students/lock` - Lock/unlock student by enrollment (admin only)
  - Accepts: enrollment, isLocked (boolean)
  - Finds user by enrollment, updates isLocked status
- `GET /students/locked` - Get all locked students (admin only)
  - Returns: list with enrollment, branch, email, userId
- `GET /students/search` - Search students by enrollment or loginId (admin only)
- `GET /students/:userId/profile` - View student profile (admin only)
- `PUT /students/:userId/profile` - Edit student profile (admin only)
  - Accepts all student profile fields including name, TNP, IC details
- `POST /students` - Create/update single student (admin only)
  - Accepts: loginId, password, enrollment, and all profile fields
  - Upserts by enrollment (updates if exists, creates if new)
- `POST /students/bulk` - Bulk create/update students from CSV (admin only)
  - Accepts: { students: array of student objects }
  - Returns: { created: count, updated: count, errors: array }

---

## 🔐 Security Features

1. **Password Hashing**: bcryptjs with 10 salt rounds
2. **JWT Authentication**: Token-based auth stored in localStorage
   - Token includes user ID and role
   - Validated on every protected route
3. **Role-Based Access Control (RBAC)**: 
   - Middleware (`requireAuth`) enforces role permissions
   - Routes protected by role arrays (e.g., `[Role.STUDENT]`, `[Role.CCD_ADMIN]`)
4. **CORS**: Configured for frontend origin with credentials
5. **Helmet**: Security headers (XSS protection, content security, etc.)
6. **Server-Side Validation**: 
   - All eligibility checks enforced server-side (cannot be bypassed)
   - Input validation on all endpoints
   - Type checking with TypeScript
7. **Audit Logging**: All admin actions logged with actor, action, and metadata
8. **SQL Injection Protection**: Prisma ORM uses parameterized queries
9. **XSS Protection**: Helmet middleware + React's built-in escaping
10. **CSRF Protection**: JWT tokens in localStorage (consider httpOnly cookies for production)

---

## 📝 Notes

### Feature Status
- **Forgot Password**: UI exists but non-functional (no OTP)
- **Notifications**: View-only, no read/unread functionality
- **CSV Export**: Functional with auth token
- **CSV Upload**: Supports bulk student creation/update with enrollment-based upsert
- **One Student, One Application**: Enforced - updating application deletes old one
- **Eligibility Re-validation**: Automatic deletion of ineligible applications when opportunity criteria updated

### Data Handling
- **Branch Eligibility**: Supports comma-separated values (e.g., "CSE,ECE,EE")
- **Gap Year Eligibility**: Integer field for max gap years allowed (null = no check)
- **Enrollment Lookup**: Primary method for student identification (unique field)
- **Password Hashing**: All passwords hashed with bcrypt (10 salt rounds)
- **Shared Fields**: Photo URL and SGPA fields (sem1-sem8) excluded from company sharing

### User Experience
- **CV Editing**: Students can edit their own CV links
- **Post Editing**: Coordinators can edit posts (triggers eligibility re-check)
- **Round Management**: Coordinators can add rounds with descriptions, dates, centres, times
- **Student Search**: CCD Admin can search by enrollment or loginId
- **Lock/Unlock**: Uses enrollment number instead of user ID for better UX

### Database Management
- **Cleanup Script**: Available for semester reset (preserves users and schema)
- **Audit Logging**: All admin actions logged with actor, action, and metadata
- **Upsert Logic**: Student creation/update uses enrollment as unique identifier

---

## 🚀 Deployment Notes

### Development Setup
- **Backend**: Runs on port 4000
  - Start: `cd backend && npm run dev` (hot reload with ts-node-dev)
  - Build: `npm run build` (compiles TypeScript to `dist/`)
  - Start production: `npm start` (runs `dist/index.js`)
- **Frontend**: Runs on port 5173 (Vite dev server)
  - Start: `cd frontend && npm run dev`
  - Build: `npm run build` (outputs to `dist/`)
  - Preview: `npm run preview` (preview production build)
- **Database**: SQLite file (`backend/dev.db`)
  - Migrations: `npx prisma migrate dev`
  - Generate client: `npx prisma generate`
  - Seed data: `npm run seed`

### Environment Variables
Create `.env` file in `backend/`:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-here"
PORT=4000
```

### Production Build
1. **Backend**:
   ```bash
   cd backend
   npm run build
   npm start
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm run build
   # Serve dist/ folder with web server (nginx, Apache, etc.)
   ```

### Database Maintenance
- **Cleanup Script**: `npx ts-node backend/prisma/cleanup.ts`
- **Verification**: `npx ts-node backend/prisma/verify-cleanup.ts`
- **Backup**: Copy `backend/dev.db` file
- **Migrations**: Always run migrations before deployment






