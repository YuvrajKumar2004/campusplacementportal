# System Architecture

## Architectural Overview

The Campus Opportunity & Internship Management Platform is designed as a **central coordination system** that sits between informal opportunity communication channels (WhatsApp, email) and the final institutional output (Google Sheets shared with companies).

The system follows a **service-oriented, backend-driven architecture**, where all business logic and decision-making reside on the server.

The frontend acts purely as a client for data input and visualization.

---

## High-Level Architecture Diagram (Conceptual)

```mermaid
flowchart TB
    WC["Web Client (Students & Coordinators)"]
    API["API Layer + Authentication"]
    ASL["Application Service Layer"]

    EE["Eligibility Engine"]
    AI["AI Assist (Optional)"]
    EX["Export Service (Sheets API)"]

    DB["Firestore Database"]

    WC --> API
    API --> ASL

    ASL --> EE
    ASL --> AI
    ASL --> EX

    EE --> DB
```


This separation ensures clarity of responsibility, auditability, and controlled data flow.

---

## Core Architectural Principles

### 1. Backend-Owned Correctness

All critical decisions—including eligibility evaluation, deadline enforcement, duplicate prevention, and export safety—are handled exclusively by the backend.

This prevents:
- Client-side tampering
- Inconsistent validation
- Silent rule bypasses

The frontend never determines correctness.

---

### 2. Clear System Boundaries

The platform deliberately defines what is **inside** and **outside** the system boundary.

**Outside the system:**
- WhatsApp messages
- Emails from companies
- Phone calls and informal coordination

**Inside the system:**
- Structured opportunity data
- Eligibility rules
- Student applications
- Exported datasets

Unstructured inputs may enter the system, but are always converted into structured, reviewable data before use.

---

### 3. Assistive, Not Autonomous Intelligence

AI is positioned strictly as an **assistive component**.

It may:
- Parse pasted opportunity text
- Suggest eligibility rules
- Highlight ambiguities

It may never:
- Publish opportunities
- Reject applications
- Modify eligibility rules post-publication
- Trigger exports

All AI output requires explicit human confirmation.

---

### 4. Operational Store vs Official Output

The system distinguishes between:
- **Operational data** (Firestore)
- **Official shared output** (Google Sheets)

Firestore is optimized for:
- Fast reads and writes
- Concurrent submissions
- Eligibility evaluation

Google Sheets remain:
- The final, shareable format
- Compatible with existing company workflows
- Institutionally trusted

This hybrid approach avoids disrupting established processes.

---

## Major System Components

### Web Client
- Used by students and coordinators
- Renders opportunities and forms
- Displays eligibility results
- Submits applications

The client does not store or infer business rules.

---

### API Layer & Authentication
- Authenticates users
- Enforces role-based access control
- Routes requests to appropriate services

Roles are capability-based and additive.

---

### Application Service Layer
This is the core of the system.

Responsibilities:
- Opportunity lifecycle management
- Application submission handling
- Deadline enforcement
- Duplicate prevention
- Eligibility invocation
- Export orchestration

No other component writes directly to core data collections.

---

### Eligibility Engine
- Rule-based
- Deterministic
- Stateless

Evaluates student-provided academic data against frozen eligibility rules and returns an explainable result.

---

### AI Assist Service (Optional)
- Stateless and non-authoritative
- Converts unstructured text into structured drafts
- Emits warnings where ambiguity exists

It never writes directly to the database.

---

### Export Service
- Interfaces with Google Sheets API
- Generates deterministic column schemas
- Ensures idempotent exports
- Marks exported applications safely

This service is isolated due to its sensitivity.

---

## Why This Architecture Was Chosen

This architecture was selected to:
- Reflect real campus workflows
- Scale during peak application periods
- Minimize coordinator workload
- Maintain institutional trust
- Avoid over-automation risks

It favors **clarity and reliability** over premature complexity.

---

## What This Architecture Does Not Attempt

- Real-time synchronization with external platforms
- Employer-facing dashboards
- Automated candidate ranking
- Persistent academic profiling

These are consciously excluded to preserve correctness and adoption.

---

## Next Sections

Subsequent documents detail:
- Individual component responsibilities
- Data models and mutability rules
- API contracts and flows
- Export pipeline internals

This document establishes the system’s structural foundation.
