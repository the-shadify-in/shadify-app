import { describe, it, expect } from "vitest";
import { runIntakeExtraction, MockExtractionProvider } from "../provider";
import { INTAKE_FIXTURES } from "../__fixtures__/samples";

describe("Intake Quality Evaluation Suite (25 Fixtures)", () => {
  it("evaluates critical field accuracy across all 25 synthetic and real-world fixtures", async () => {
    let totalCriticalFields = 0;
    let accurateCriticalFields = 0;

    const provider = new MockExtractionProvider();

    for (const fixture of INTAKE_FIXTURES) {
      const result = await runIntakeExtraction({ rawText: fixture.rawText }, provider);
      const draft = result.draft;

      // 1. Critical Field: Partner Names
      if (fixture.expected.partnerAName && fixture.expected.partnerBName) {
        totalCriticalFields += 2;
        if (
          draft.couple?.partnerAName.toLowerCase() ===
            fixture.expected.partnerAName.toLowerCase() &&
          draft.couple?.partnerBName.toLowerCase() === fixture.expected.partnerBName.toLowerCase()
        ) {
          accurateCriticalFields += 2;
        }
      }

      // 2. Critical Field: Wedding Date
      if (fixture.expected.weddingDate) {
        totalCriticalFields++;
        if (draft.weddingDate.value === fixture.expected.weddingDate) {
          accurateCriticalFields++;
        }
      }

      // 3. Critical Field: City
      if (fixture.expected.city) {
        totalCriticalFields++;
        if (draft.city.value?.toLowerCase() === fixture.expected.city.toLowerCase()) {
          accurateCriticalFields++;
        }
      }

      // 4. Critical Field: Contacts / Phone
      if (fixture.expected.hasPhone) {
        totalCriticalFields++;
        const contact = draft.contacts[0];
        if (contact && contact.phoneRaw.length > 0) {
          accurateCriticalFields++;
        }
      }
    }

    const accuracyPercent = Math.round((accurateCriticalFields / totalCriticalFields) * 100);

    // Assert that accuracy meets the minimum rollout threshold (>= 85%)
    // If below threshold, review gating MUST stay active on every field.
    const ACCURACY_THRESHOLD_PERCENT = 85;
    expect(accuracyPercent).toBeGreaterThanOrEqual(ACCURACY_THRESHOLD_PERCENT);

    console.log(
      `[Intake Assistant Evaluation] Critical-field accuracy: ${accuracyPercent}% (${accurateCriticalFields}/${totalCriticalFields} fields matched across ${INTAKE_FIXTURES.length} fixtures). Threshold: ${ACCURACY_THRESHOLD_PERCENT}%.`,
    );
  });
});
