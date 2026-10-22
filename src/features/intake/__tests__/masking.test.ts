import { describe, it, expect } from "vitest";
import { maskPii, unmaskText, unmaskData } from "../masking";

describe("Local PII Masking Module", () => {
  it("masks phone numbers, emails, and UPI handles with tokens", () => {
    const raw =
      "Please RSVP with Rahul at +91 98765 43210 or email wed@priyarahul.com. Send Shagun to priya@okhdfcbank.";
    const { maskedText, tokenMap } = maskPii(raw);

    expect(maskedText).not.toContain("+91 98765 43210");
    expect(maskedText).not.toContain("wed@priyarahul.com");
    expect(maskedText).not.toContain("priya@okhdfcbank");

    expect(maskedText).toMatch(/\[PHONE_REF_\d+\]/);
    expect(maskedText).toMatch(/\[EMAIL_REF_\d+\]/);
    expect(maskedText).toMatch(/\[UPI_REF_\d+\]/);

    const unmasked = unmaskText(maskedText, tokenMap);
    expect(unmasked).toBe(raw);
  });

  it("does not mask years or 4-digit numbers as phones", () => {
    const text = "Wedding is on 14 December 2026 at 1800 hrs.";
    const { maskedText } = maskPii(text);
    expect(maskedText).toContain("2026");
    expect(maskedText).toContain("1800");
  });

  it("unmasks nested structured data objects and arrays", () => {
    const raw = "Contact: +91 9876543210, UPI: couple@upi";
    const { tokenMap } = maskPii(raw);

    const structured = {
      couple: { name: "Priya" },
      contacts: [{ phoneRaw: "[PHONE_REF_1]" }],
      upi: "[UPI_REF_1]",
    };

    const restored = unmaskData(structured, tokenMap);
    expect(restored.contacts[0]?.phoneRaw).toBe("+91 9876543210");
    expect(restored.upi).toBe("couple@upi");
  });
});
