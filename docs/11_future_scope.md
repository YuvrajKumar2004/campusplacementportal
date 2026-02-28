# Future Scope

This document outlines potential future extensions to the system that are deliberately excluded from the MVP.

These items are not required for correctness, but may be considered once the core platform is stable and adopted.

---

## Design Philosophy for Future Work

Any future extension must satisfy the following principles:

- Must not break existing data contracts
- Must preserve Google Sheets as the final institutional output
- Must not introduce persistent student academic profiles
- Must remain auditable and explainable
- Must not over-automate human decision-making

Features that violate these principles are intentionally excluded.

---

## Notifications and Communication

Potential enhancements:
- Automated email notifications for newly published opportunities
- Deadline reminder notifications to students
- Export completion notifications to coordinators

Non-goals:
- Replacing WhatsApp or informal communication
- Real-time chat features

Notifications should remain informational, not authoritative.

---

## Advanced Coordinator Dashboards

Potential enhancements:
- Time-series views of application counts
- Branch-wise and batch-wise application breakdowns
- Eligibility distribution summaries

These dashboards must remain read-only and derived from existing application data.

---

## Multi-Campus or Multi-Department Support

Potential enhancements:
- Support for multiple departments or campuses within the same deployment
- Logical segregation of opportunities by unit

This would require:
- Stronger role scoping
- Namespace separation at the opportunity level

---

## Document Ingestion Improvements

Potential enhancements:
- PDF attachment parsing for job descriptions
- OCR support for image-based notices
- Better ambiguity detection in eligibility text

All extracted data must continue to require explicit human confirmation.

---

## Export Customization

Potential enhancements:
- Custom column ordering per institute
- Institute-specific export templates
- Additional export formats alongside Google Sheets

Any customization must remain deterministic and idempotent.

---

## Analytics and Reporting

Potential enhancements:
- Aggregate reports across multiple opportunities
- Year-over-year application trends
- Coordinator workload metrics

Analytics must operate on anonymized or aggregate data where possible.

---

## What Will Not Be Built

The following are explicitly out of scope, even in the future:

- Automated candidate shortlisting or ranking
- Employer-facing portals
- Persistent academic profiling of students
- Predictive hiring or recommendation systems

These are excluded to preserve fairness, trust, and institutional alignment.

---

## Closing Note

The strength of this system lies in its restraint.

Future work should enhance clarity, reliability, and coordinator efficiency without compromising the principles that make the platform deployable in real campus environments.
