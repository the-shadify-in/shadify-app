import { describe, it, expect } from "vitest";
import { normalizePhoneNumber } from "../phone";

describe("Phone Number Normalization & E.164 Engine", () => {
  it("normalizes standard 10-digit Indian mobile numbers to E.164", () => {
    const result = normalizePhoneNumber("9876543210");
    expect(result.valid).toBe(true);
    expect(result.e164).toBe("+919876543210");
    expect(result.country).toBe("IN");
  });

  it("normalizes formatted Indian numbers with spaces and +91 prefix", () => {
    const result = normalizePhoneNumber("+91 98765 43210");
    expect(result.valid).toBe(true);
    expect(result.e164).toBe("+919876543210");
  });

  it("normalizes Indian numbers with leading zero format (098765 43210)", () => {
    const result = normalizePhoneNumber("098765 43210");
    expect(result.valid).toBe(true);
    expect(result.e164).toBe("+919876543210");
  });

  it("normalizes international North American numbers (+1)", () => {
    const result = normalizePhoneNumber("+1 (650) 253-0000");
    expect(result.valid).toBe(true);
    expect(result.e164).toBe("+16502530000");
    expect(result.country).toBe("US");
  });

  it("normalizes international UK mobile numbers (+44)", () => {
    const result = normalizePhoneNumber("+44 7700 900123");
    expect(result.valid).toBe(true);
    expect(result.e164).toBe("+447700900123");
    expect(result.country).toBe("GB");
  });

  it("normalizes international UAE mobile numbers (+971)", () => {
    const result = normalizePhoneNumber("+971 50 123 4567");
    expect(result.valid).toBe(true);
    expect(result.e164).toBe("+971501234567");
    expect(result.country).toBe("AE");
  });

  it("rejects short or arbitrary strings like 1234567", () => {
    const result = normalizePhoneNumber("1234567");
    expect(result.valid).toBe(false);
    expect(result.e164).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it("rejects empty, null, or whitespace-only inputs", () => {
    expect(normalizePhoneNumber("").valid).toBe(false);
    expect(normalizePhoneNumber("   ").valid).toBe(false);
  });
});
