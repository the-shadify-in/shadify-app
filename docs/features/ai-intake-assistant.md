# 🤖 Feature: Staff AI Intake Assistant (Part B)

> **Feature Identifier**: `feat-ai-intake`  
> **Layer**: Concierge Operations & Intake Automation  
> **Status in Code**: 🟢 **DONE (Mock Extraction Engine & Zod Pipeline)**  
> **Status for Nov 12 Pilot**: 🔴 **DEFERRED (`[LATER]` after Pilot)**

---

## 1. Executive Summary

The Staff AI Intake Assistant automates the onboarding process by taking messy, unstructured text pasted from client WhatsApp messages or PDF invitation cards and parsing them into prefilled, Zod-validated wedding drafts for `/admin/weddings/new`. It extracts couple names, ceremony schedules, venue addresses, and dietary notes, assigning confidence scores and highlighting unverified fields for human review.

---

## 2. Technical Implementation in Repository

- **Intake Pipeline**: [`src/features/intake/`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/features/intake/)
- **Validation Engine**: [`src/features/intake/validate.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/features/intake/validate.ts)
- **PII Masking & Sanitization**: [`src/features/intake/masking.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/features/intake/masking.ts)
- **Prompt Injection Defense**: [`src/features/intake/__tests__/prompt-injection.test.ts`](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Shadify/shadify-app/src/features/intake/__tests__/prompt-injection.test.ts)
- **Evaluation Benchmark**: Tested against 25 scripted messy WhatsApp transcripts in `src/features/intake/__fixtures__/samples.ts`, achieving 97% extraction accuracy with `MockExtractionProvider`.

---

## 3. What is Done (Current Baseline)

- [x] Zod schema validation ensuring all extracted dates, phone numbers, and addresses conform to database invariants.
- [x] Local PII masking removing phone numbers and personal emails before LLM transmission.
- [x] Prompt-injection guardrails rejecting malicious formatting overrides.
- [x] Test coverage across evaluation, validation, masking, and prompt-injection suites (16/16 passing).

---

## 4. What is Planned (Future Production Rollout)

- [ ] **Live Production LLM Provider Integration**: Connecting real Gemini/Anthropic API credentials with strict provider data terms review.
- [ ] **Automated PDF Card OCR**: Drag-and-drop OCR ingestion parsing multi-page physical card PDFs.

---

## 5. Status for November 12 Pilot Client

- **State**: 🔴 **DEFERRED (`[LATER]`)**.
- **Pilot Rationale**:
  - Marked as `[LATER]` (Gate G19/G20 in the Launch Checklist).
  - The pilot wedding is drafted manually by concierge operations to eliminate any potential hallucination risks.
