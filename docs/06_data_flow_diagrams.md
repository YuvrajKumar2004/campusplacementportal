# Data Flow Diagrams

This document describes the runtime data flows across major system actions using Mermaid diagrams.

---

## Opportunity Creation Flow

```mermaid
flowchart TD
    C[Coordinator UI] --> A[API Layer]
    A --> S[Application Service]
    S -->|Optional| AI[AI Assist Service]
    S --> DB[Firestore]
```

---

## Opportunity Publish Flow

```mermaid
flowchart TD
    C[Coordinator UI] --> A[API Layer]
    A --> S[Application Service]
    S --> DB[Firestore]
```

---

## Eligibility Check Flow

```mermaid
flowchart TD
    U[Student UI] --> A[API Layer]
    A --> S[Application Service]
    S --> E[Eligibility Engine]
    E --> S
    S --> U
```

---

## Application Submission Flow

```mermaid
flowchart TD
    U[Student UI] --> A[API Layer]
    A --> S[Application Service]
    S --> E[Eligibility Engine]
    S --> DB[Firestore]
```

---

## Export Flow

```mermaid
flowchart TD
    L[Lead Coordinator UI] --> A[API Layer]
    A --> X[Export Service]
    X --> DB[Firestore]
    X --> GS[Google Sheets]
```
