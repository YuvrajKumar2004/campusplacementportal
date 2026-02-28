# Component Design

This document describes the major components of the system, their responsibilities, and their boundaries.

Each component is designed to have **clear ownership**, minimal overlap, and a well-defined purpose.

---

## Web Client

### Purpose
The Web Client provides the user interface for students and coordinators to interact with the platform.

It is intentionally kept thin and free of business logic.

---

### Responsibilities
- Display on-campus opportunities
- Render dynamic application forms
- Collect student inputs
- Display eligibility results and submission status
- Provide coordinator interfaces for opportunity creation and monitoring

---

### Explicit Non-Responsibilities
- Eligibility evaluation
- Deadline enforcement
- Duplicate detection
- Export logic
- Business rule interpretation

All such decisions are delegated to the backend.

---

## API Layer & Authentication

### Purpose
The API Layer acts as the secure entry point to the backend.

It authenticates users, enforces authorization, and routes requests to internal services.

---

### Responsibilities
- User authentication (email-based)
- Role-based access control
- Request validation at boundary level
- Forwarding requests to application services

---

### Explicit Non-Responsibilities
- Business logic
- Data persistence decisions
- Eligibility evaluation

---

## Application Service Layer

### Purpose
The Application Service Layer is the **core coordinator** of system behavior.

All meaningful system actions pass through this layer.

---

### Responsibilities
- Opportunity lifecycle management (draft, publish, close, export)
- Application submission processing
- Deadline enforcement
- Duplicate application prevention
- Invocation of eligibility checks
- Coordination of exports to Google Sheets

---

### Explicit Non-Responsibilities
- Direct UI rendering
- AI parsing logic
- Low-level storage access by external components

Only this layer may write to core Firestore collections.

---

## Eligibility Engine

### Purpose
The Eligibility Engine evaluates whether a student meets the eligibility criteria for a given opportunity.

It is designed as a deterministic, rule-based engine.

---

### Responsibilities
- Evaluate structured eligibility rules
- Return eligibility status (eligible / ineligible / manual)
- Provide human-readable reasons for decisions

---

### Explicit Non-Responsibilities
- Persisting results independently
- Inferring rules from text
- Making final policy decisions

The engine is invoked by the Application Service Layer and has no side effects.

---

## AI Assist Service

### Purpose
The AI Assist Service helps coordinators convert unstructured opportunity descriptions into structured drafts.

It is an **optional accelerator**, not a dependency.

---

### Responsibilities
- Parse pasted text from emails, WhatsApp messages, or documents
- Suggest structured eligibility rules
- Identify ambiguous or missing information
- Provide warnings and confidence indicators

---

### Explicit Non-Responsibilities
- Publishing opportunities
- Writing directly to the database
- Enforcing eligibility
- Making irreversible decisions

All AI output must be reviewed and confirmed by a human coordinator.

---

## Export Service

### Purpose
The Export Service handles the transformation of internal application data into Google Sheets shared with companies.

This is the most sensitive component in the system.

---

### Responsibilities
- Generate deterministic column schemas
- Interface with Google Sheets APIs
- Append application data safely
- Ensure idempotent exports
- Mark applications as exported

---

### Explicit Non-Responsibilities
- Application filtering based on non-defined rules
- Eligibility reevaluation
- UI interactions

The Export Service operates only when explicitly triggered by an authorized user.

---

## Firestore (Operational Datastore)

### Purpose
Firestore acts as the internal operational datastore for the platform.

---

### Responsibilities
- Store opportunities, applications, users, and export metadata
- Support high-concurrency reads and writes
- Enable indexed queries for coordinator dashboards

---

### Explicit Non-Responsibilities
- Acting as the final institutional record
- Performing business logic
- Enforcing application correctness independently

Firestore stores state; it does not decide behavior.

---

## Component Interaction Summary

- The Web Client communicates only with the API Layer
- The API Layer routes requests to the Application Service Layer
- The Application Service Layer invokes:
  - Eligibility Engine
  - AI Assist Service (optional)
  - Export Service (restricted)
- Firestore is written to exclusively by the Application Service Layer

This structure ensures clarity, auditability, and safe evolution of the system.

---

## Why This Component Breakdown Matters

Clear component boundaries:
- Reduce coupling
- Simplify debugging
- Enable incremental development
- Prevent accidental rule violations

Each component can be reasoned about independently while contributing to a coherent system.

