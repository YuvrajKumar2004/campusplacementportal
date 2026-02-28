# Problem Context & Real-World Constraints

## Current Workflow on Campus

At present, on-campus internship and placement opportunities are managed through a loosely coupled set of tools and informal processes:

1. Companies share opportunity details with student coordinators via:
   - WhatsApp messages
   - Emails
   - Forwarded job descriptions or PDFs

2. Coordinators forward these details to students through WhatsApp groups.

3. Each opportunity includes a Google Form link where students submit:
   - Personal details
   - Academic information (CGPA, backlogs, etc.)
   - Resume links
   - Company-specific questions

4. After the deadline, lead student coordinators:
   - Manually clean Google Sheet responses
   - Remove ineligible or duplicate entries
   - Reformat data
   - Forward the final sheet to the company HR

This workflow is functional, but fragile and inefficient at scale.

---

## Problems With the Current System

### 1. Scattered and Unstructured Information

Opportunity details are distributed across WhatsApp messages and forwarded texts, making it easy for students to:
- Miss deadlines
- Misinterpret eligibility criteria
- Lose track of active opportunities

There is no single, authoritative source of on-campus opportunities.

---

### 2. High Volume of Ineligible Applications

Eligibility criteria (branch, CGPA, backlogs, batch) are usually described in free text.

As a result:
- Students often apply without fully understanding eligibility
- Coordinators must manually filter ineligible entries
- Legitimate applicants may be delayed or overlooked

This creates avoidable workload and friction.

---

### 3. Heavy Manual Effort for Coordinators

During peak periods:
- A single opportunity may receive up to 500 applications
- Lead coordinators spend hours cleaning sheets
- Small formatting errors can delay communication with companies

This manual work is repetitive, error-prone, and difficult to audit.

---

### 4. No Trusted Central Academic Profile

Student academic data (CGPA, backlogs, etc.) is **not stored centrally** by the institute in a form that can be safely reused.

As a result:
- Academic information is collected afresh for every opportunity
- Eligibility checks cannot rely on persistent profiles
- Each application must be treated as an independent data snapshot

Any system must operate under this constraint.

---

### 5. Institutional and Operational Constraints

The placement process operates under several non-negotiable realities:

- Google Sheets are the **final, official format** shared with companies
- No internal shortlisting or ranking is performed by coordinators
- Institute authorities can request any data related to applications
- Privacy expectations are institutional rather than user-defined
- Off-campus opportunities are applied to externally and cannot be controlled

These constraints define the boundaries of what the system can and cannot do.

---

## Why Incremental Fixes Are Insufficient

Small improvements—such as better WhatsApp formatting or stricter Google Forms—do not address the core issues:

- Eligibility remains text-based and ambiguous
- Data validation happens after submission, not before
- Manual cleaning effort grows with application volume
- There is no consistent audit trail

A structural change is required, not a cosmetic one.

---

## Problem Summary

The current system suffers from:
- Unstructured opportunity data
- Reactive eligibility enforcement
- Manual, high-effort coordination
- Poor scalability during peak seasons

Any effective solution must:
- Centralize opportunity information
- Enforce eligibility rules before submission
- Reduce coordinator workload
- Respect institutional constraints and workflows

These requirements directly inform the system design described in subsequent sections.
