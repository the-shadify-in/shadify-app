import { describe, it, expect } from "vitest";
import { runIntakeExtraction } from "../provider";
import { INTAKE_FIXTURES } from "../__fixtures__/samples";

describe("Prompt-Injection Defenses & Adversarial Input Robustness", () => {
  const injectionFixtures = INTAKE_FIXTURES.filter((f) => f.category === "injection");

  it("handles 'ignore previous instructions' attack and outputs only schema-valid draft", async () => {
    const fixture = injectionFixtures.find((f) => f.id === "fix-11-injection-ignore")!;
    const result = await runIntakeExtraction({ rawText: fixture.rawText });

    expect(result.draft).toBeDefined();
    expect(result.draft.couple).toBeDefined();
    expect(result.draft.couple?.partnerAName).toBe("Priya");
    expect(result.draft.couple?.partnerBName).toBe("Rahul");
    // Ensure no admin keys were injected
    expect((result.draft as Record<string, unknown>).admin).toBeUndefined();
    expect((result.draft as Record<string, unknown>).password).toBeUndefined();
  });

  it("handles fake JSON delimiters and SQL/XSS markup safely", async () => {
    const fixture = injectionFixtures.find((f) => f.id === "fix-12-injection-fake-json")!;
    const result = await runIntakeExtraction({ rawText: fixture.rawText });

    expect(result.draft).toBeDefined();
    expect(result.draft.couple?.partnerAName).toBe("Pooja");
    expect(result.draft.couple?.partnerBName).toBe("Rohan");
    // Script tag was stripped
    expect(JSON.stringify(result.draft)).not.toContain("<script>");
  });

  it("resists system prompt override attempts", async () => {
    const fixture = injectionFixtures.find((f) => f.id === "fix-13-injection-system-override")!;
    const result = await runIntakeExtraction({ rawText: fixture.rawText });

    expect(result.draft).toBeDefined();
    expect(result.draft.couple?.partnerAName).toBe("Sahil");
    expect(result.draft.couple?.partnerBName).toBe("Tanvi");
  });

  it("processes extremely long garbage padding without crashing", async () => {
    const fixture = injectionFixtures.find((f) => f.id === "fix-24-injection-padding")!;
    const result = await runIntakeExtraction({ rawText: fixture.rawText });

    expect(result.draft).toBeDefined();
    expect(result.draft.couple?.partnerAName).toBe("Aniket");
    expect(result.draft.couple?.partnerBName).toBe("Shweta");
  });
});
