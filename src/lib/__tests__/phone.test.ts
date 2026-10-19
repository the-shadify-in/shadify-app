import { describe, it, expect } from "vitest";
import { normalizePhoneNumber, toWhatsAppNumber } from "../phone";

describe("Phone Number Normalization & E.164 Engine", () => {
  it("normalizes standard 10-digit Indian mobile numbers to E.164", () => {
    const result = normalizePhoneNumber("9876543210");
    expect(result.valid).toBe(true);
    expect(result.e164).toBe("+919876543210");
    expect(result.country).toBe("IN");
  });

  it("normalizes formatted Indian numbers with spaces and +91 prefix (+91 98765 43210)", () => {
    const result = normalizePhoneNumber("+91 98765 43210");
    expect(result.valid).toBe(true);
    expect(result.e164).toBe("+919876543210");
  });

  it("normalizes Indian numbers with leading zero format (098765 43210)", () => {
    const result = normalizePhoneNumber("098765 43210");
    expect(result.valid).toBe(true);
    expect(result.e164).toBe("+919876543210");
  });

  it("normalizes international IDD 00 prefix (0091... and 0044...)", () => {
    const resultIN = normalizePhoneNumber("00919876543210");
    expect(resultIN.valid).toBe(true);
    expect(resultIN.e164).toBe("+919876543210");

    const resultUK = normalizePhoneNumber("00447400123456");
    expect(resultUK.valid).toBe(true);
    expect(resultUK.e164).toBe("+447400123456");
    expect(resultUK.country).toBe("GB");
  });

  it("normalizes numbers with leading + plus spaces (+ 91 98765 43210)", () => {
    const result = normalizePhoneNumber("+ 91 98765 43210");
    expect(result.valid).toBe(true);
    expect(result.e164).toBe("+919876543210");
  });

  it("normalizes international North American numbers (+1)", () => {
    const result = normalizePhoneNumber("+1 (650) 253-0000");
    expect(result.valid).toBe(true);
    expect(result.e164).toBe("+16502530000");
    expect(result.country).toBe("US");
  });

  it("normalizes international UAE mobile numbers (+971)", () => {
    const result = normalizePhoneNumber("+971 50 123 4567");
    expect(result.valid).toBe(true);
    expect(result.e164).toBe("+971501234567");
    expect(result.country).toBe("AE");
  });

  it("strictly rejects invalid numbers like 1234567 and all-zero 0000000000 via isValid()", () => {
    const shortResult = normalizePhoneNumber("1234567");
    expect(shortResult.valid).toBe(false);
    expect(shortResult.e164).toBeUndefined();

    const allZeros = normalizePhoneNumber("0000000000");
    expect(allZeros.valid).toBe(false);
    expect(allZeros.e164).toBeUndefined();
  });

  it("rejects empty, null, or whitespace-only inputs", () => {
    expect(normalizePhoneNumber("").valid).toBe(false);
    expect(normalizePhoneNumber("   ").valid).toBe(false);
  });

  it("formats valid E.164 numbers for WhatsApp click-to-chat links (toWhatsAppNumber)", () => {
    expect(toWhatsAppNumber("+919876543210")).toBe("919876543210");
    expect(toWhatsAppNumber("+447911123456")).toBe("447911123456");
  });
});
