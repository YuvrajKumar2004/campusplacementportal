# API Contracts

This document defines the external API contracts exposed by the backend. These APIs are considered stable contracts between the frontend and backend.

The frontend is treated as an untrusted client. All validation, eligibility checks, and enforcement of rules are handled server-side.

---

## API Design Principles

- Backend owns all business logic and correctness
- Frontend performs no eligibility or deadline logic
- All sensitive operations are role-protected
- APIs are explicit and predictable
- Errors are fail-fast and explainable

---

## Authentication & Authorization

Authentication is email-based and handled centrally.

Each request is associated with a user identity and a set of roles.

Supported roles:
- STUDENT
- COORDINATOR
- LEAD_COORDINATOR

Roles are additive. A single user may hold multiple roles.

---

## Opportunity APIs

### Create Opportunity (Manual or AI-Assisted)

Endpoint:
```
POST /api/opportunities
```

Roles:
- COORDINATOR

Request Body:
```json
{
  "title": "Software Intern – Backend",
  "companyName": "ABC Tech",
  "description": "Opportunity description",
  "type": "ON_CAMPUS",
  "deadline": "2025-09-30T23:59:00Z",
  "rawOpportunityText": "Optional pasted email or WhatsApp text",
  "customFields": []
}
```

Behavior:
- Creates an opportunity in DRAFT state
- If rawOpportunityText is provided, AI assist may generate a draft
- Opportunity is not visible to students until published

---

### Publish Opportunity

Endpoint:
```
POST /api/opportunities/{opportunityId}/publish
```

Roles:
- COORDINATOR

Behavior:
- Freezes eligibility rules and custom fields
- Moves opportunity to OPEN state
- After publishing, eligibility rules cannot be modified

---

### Get Open Opportunities (Student View)

Endpoint:
```
GET /api/opportunities
```

Roles:
- STUDENT

Behavior:
- Returns only OPEN opportunities
- Excludes expired deadlines
- Lightweight response for listing

---

## Eligibility APIs

### Check Eligibility (Pre-Submission)

Endpoint:
```
POST /api/eligibility/check
```

Roles:
- STUDENT

Request Body:
```json
{
  "opportunityId": "op123",
  "academics": {
    "branch": "ECE",
    "cgpa": 7.5,
    "backlogs": 0,
    "class10": 85,
    "class12": 90,
    "batch": 2026
  }
}
```

Response Body:
```json
{
  "status": "ELIGIBLE",
  "reasons": []
}
```

Notes:
- Eligibility is always recomputed during final submission
- This endpoint exists for transparency only

---

## Application APIs

### Submit Application

Endpoint:
```
POST /api/applications
```

Roles:
- STUDENT

Request Body:
```json
{
  "opportunityId": "op123",
  "student": {
    "name": "Rahul Sharma",
    "email": "rahul@institute.edu",
    "rollNo": "21ECE045",
    "branch": "ECE",
    "batch": 2026,
    "contact": "9XXXXXXXXX"
  },
  "academics": {
    "cgpa": 7.82,
    "backlogs": 0,
    "class10": 88,
    "class12": 91
  },
  "customResponses": {},
  "resume": "<multipart file>"
}
```

Behavior:
- Validates deadline and duplicate submission
- Recomputes eligibility server-side
- Stores application as immutable record

---

## Coordinator APIs

### Get Application Statistics

Endpoint:
```
GET /api/opportunities/{opportunityId}/applications/stats
```

Roles:
- COORDINATOR

Response Body:
```json
{
  "total": 312,
  "eligible": 180,
  "ineligible": 132
}
```

---

## Export APIs

### Export Applications to Google Sheets

Endpoint:
```
POST /api/opportunities/{opportunityId}/export
```

Roles:
- LEAD_COORDINATOR

Behavior:
- Locks opportunity
- Exports unexported applications
- Creates or reuses Google Sheet
- Marks applications as exported
- Operation is idempotent

Response Body:
```json
{
  "sheetId": "google-sheet-id",
  "exportedCount": 312
}
```

---

## Error Handling

- All errors return structured JSON responses
- Authorization failures return HTTP 403
- Validation failures return HTTP 400 with explanation
- Unexpected failures return HTTP 500 without partial state changes

---

## Contract Stability

These API contracts are expected to remain stable throughout the MVP lifecycle.

Any breaking change requires:
- Versioning
- Documentation update
- Coordinated frontend changes
