# System Overview

## What This Platform Is

The Campus Opportunity & Internship Management Platform is a **campus-first web system** designed to centralize the creation, distribution, and management of on-campus internship and placement opportunities.

It replaces the current ad-hoc workflow of:
- WhatsApp messages for announcements
- Google Forms for applications
- Manual Google Sheets cleaning by coordinators

with a **structured, auditable, and scalable system**, while **retaining Google Sheets as the final institutional source of truth**.

The platform is built specifically for the operational realities of Indian engineering campuses.

---

## Who This Platform Is For

- **Students** applying to on-campus opportunities
- **Student Coordinators** managing opportunities and applications
- **Lead Coordinators / Placement Cell Representatives** responsible for exporting data to companies

This platform is **not** designed for employers or off-campus application handling.

---

## Core Goals

1. Centralize all on-campus opportunities in a single platform
2. Reduce ineligible and duplicate applications through rule-based eligibility checks
3. Eliminate manual data cleaning before sending applications to companies
4. Preserve existing institutional workflows by exporting final data to Google Sheets
5. Improve transparency and trust for both students and coordinators

---

## Explicit Non-Goals

To avoid scope creep and unrealistic assumptions, the platform deliberately does **not** aim to:

- Replace human communication channels (WhatsApp, email, calls)
- Perform internal shortlisting or ranking of candidates
- Maintain persistent student academic profiles
- Automate employer-side workflows
- Scrape job postings or external platforms

These constraints are intentional and shape the system design.

---

## High-Level System Philosophy

The platform follows three core principles:

1. **Campus-first realism**  
   Design decisions reflect how placement processes actually work, not how they work in idealized systems.

2. **Structure without disruption**  
   The system replaces unstructured data handling, not human coordination or institutional authority.

3. **Assistive intelligence, not autonomous decisions**  
   AI is used only to assist coordinators (e.g., parsing unstructured opportunity text), never to make final decisions.

---

## System at a Glance

At a high level, the system consists of:
- A web-based client for students and coordinators
- A backend application service handling business logic
- A rule-based eligibility engine
- An optional AI-assisted parsing layer
- Firestore as the internal operational datastore
- Google Sheets as the final export layer shared with companies

Each of these components is detailed in subsequent documents.

---

## Documentation Roadmap

This repository is documentation-first.  
Detailed design decisions are covered in the following sections:

- Problem context and constraints
- System architecture
- Component responsibilities
- Data models and mutability rules
- API contracts
- Data flow diagrams
- Google Sheets export pipeline
- AI usage boundaries
- Security and role design
- Scalability and failure modes
- Future scope

