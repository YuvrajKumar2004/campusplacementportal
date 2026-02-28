# Security and Roles

This document defines access control and role boundaries.

---

## Roles

- STUDENT
- COORDINATOR
- LEAD_COORDINATOR

Roles are additive.

---

## Permission Model

```mermaid
flowchart TD
    STUDENT -->|Apply| APPLY[Submit Application]
    COORDINATOR -->|Create| CREATE[Create Opportunity]
    LEAD -->|Export| EXPORT[Export to Sheets]
```

---

## Security Principles

- Backend enforces all permissions
- Frontend is treated as untrusted
- Sensitive actions require explicit role checks
