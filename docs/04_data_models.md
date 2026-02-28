# Data Models

This document defines the core data models used by the system, their schemas, and the rules governing how they may change over time.

The data model is intentionally conservative. It prioritizes fairness, auditability, predictable exports, institutional trust, and minimal long-lived state.

Once implemented, these models are considered frozen contracts.

---

## Design Principles

### Snapshot-Based Data
The system does not maintain persistent student academic profiles. Each application stores a complete snapshot of student-provided data. Eligibility is evaluated against frozen rules at submission time, ensuring historical explainability.

### Immutability by Default
Most fields are immutable after creation. This prevents silent data tampering, simplifies exports, and improves auditability.

### Separation of Concerns
Each collection has a single, clear responsibility. No collection serves multiple unrelated purposes.

---

## Collections Overview

The MVP uses the following Firestore collections:

```
users/
opportunities/
applications/
exports/
```

---

## users Collection

Purpose:
Stores authenticated users and their system roles. This collection does not store student academic data.

Path:
```
users/{userId}
```

Schema:
```json
{
  "name": "Full Name",
  "email": "user@institute.edu",
  "roles": ["COORDINATOR", "LEAD_COORDINATOR"],
  "createdAt": "timestamp"
}
```

Mutability Rules:
- name: mutable (minor corrections allowed)
- roles: mutable (roles are additive)
- email: immutable (identity anchor)
- createdAt: immutable (audit-only)

---

## opportunities Collection

Purpose:
Represents a single on-campus opportunity and its application rules.

Path:
```
opportunities/{opportunityId}
```

Schema:
```json
{
  "title": "Software Intern – Backend",
  "companyName": "ABC Tech",
  "description": "Opportunity description",
  "type": "ON_CAMPUS",
  "deadline": "timestamp",
  "eligibilityRules": {
    "allowedBranches": ["CSE", "ECE"],
    "minCGPA": 7.0,
    "maxBacklogs": 0,
    "minClass10": 70,
    "minClass12": 70,
    "batch": [2026, 2027]
  },
  "customFields": [
    {
      "fieldId": "github",
      "label": "GitHub Profile",
      "type": "URL",
      "required": false
    }
  ],
  "status": "OPEN",
  "createdBy": "userId",
  "createdAt": "timestamp",
  "aiMetadata": {
    "source": "PASTED_TEXT",
    "confidenceWarnings": [
      "CGPA inferred from ambiguous phrasing"
    ]
  },
  "sheet": {
    "sheetId": null,
    "exportedAt": null
  }
}
```

Lifecycle:
```
DRAFT → OPEN → EXPORTING → EXPORTED / CLOSED
```

Mutability Rules:
- eligibilityRules: immutable after publish (fairness and auditability)
- customFields: immutable after publish (sheet schema stability)
- title: immutable after publish
- companyName: immutable after publish
- description: mutable (clarifications allowed)
- deadline: mutable (real-world changes)
- status: mutable (lifecycle control)
- sheet: system-managed

---

## applications Collection

Purpose:
Stores a single student application to a specific opportunity. Each application is treated as an immutable record.

Path:
```
applications/{applicationId}
```

Schema:
```json
{
  "opportunityId": "op123",
  "student": {
    "name": "Student Name",
    "email": "student@institute.edu",
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
  "resumeUrl": "gs://bucket/resume.pdf",
  "customResponses": {
    "github": "https://github.com/..."
  },
  "eligibilityResult": {
    "status": "ELIGIBLE",
    "reasons": []
  },
  "submittedAt": "timestamp",
  "exported": false
}
```

Mutability Rules:
- exported: mutable (idempotent exports)
- all other fields: immutable

---

## exports Collection

Purpose:
Provides an audit trail for export actions.

Path:
```
exports/{exportId}
```

Schema:
```json
{
  "opportunityId": "op123",
  "sheetId": "google-sheet-id",
  "exportedBy": "userId",
  "exportedAt": "timestamp",
  "applicationCount": 312
}
```

---

## Data Integrity Guarantees

- One application per student per opportunity
- Eligibility rules cannot change after publication
- Application data cannot be modified post-submission
- Export operations are idempotent and traceable

---

## Why This Data Model Works

This model matches real campus workflows, avoids hidden or inferred state, scales to peak application volumes, produces deterministic Google Sheets, and remains easy to audit and reason about.
