import { describe, it, expect } from "vitest";
import { parseAskHash, getHashForTopic } from "../topics";

describe("Ask Hash Parser & Topic Deep-links", () => {
  it("returns isOpen: false for empty or non-ask hashes", () => {
    expect(parseAskHash("")).toEqual({ isOpen: false, topic: null });
    expect(parseAskHash("#rsvp")).toEqual({ isOpen: false, topic: null });
    expect(parseAskHash("#hero")).toEqual({ isOpen: false, topic: null });
    expect(parseAskHash("something_else")).toEqual({ isOpen: false, topic: null });
  });

  it("opens topic list for exact '#ask'", () => {
    expect(parseAskHash("#ask")).toEqual({ isOpen: true, topic: null });
    expect(parseAskHash("ask")).toEqual({ isOpen: true, topic: null });
  });

  it("parses valid individual topic hashes", () => {
    expect(parseAskHash("#ask=venue")).toEqual({ isOpen: true, topic: "venue" });
    expect(parseAskHash("#ask=dress-code")).toEqual({ isOpen: true, topic: "dress_code" });
    expect(parseAskHash("#ask=timings")).toEqual({ isOpen: true, topic: "timings" });
    expect(parseAskHash("#ask=gifts")).toEqual({ isOpen: true, topic: "gifts" });
    expect(parseAskHash("#ask=rsvp")).toEqual({ isOpen: true, topic: "rsvp" });
    expect(parseAskHash("#ask=other")).toEqual({ isOpen: true, topic: "other" });
  });

  it("falls back to topic list when an unknown topic parameter is given", () => {
    expect(parseAskHash("#ask=flight-booking")).toEqual({ isOpen: true, topic: null });
    expect(parseAskHash("#ask=weather")).toEqual({ isOpen: true, topic: null });
    expect(parseAskHash("#ask=")).toEqual({ isOpen: true, topic: null });
  });

  it("generates correct URL hashes from topics", () => {
    expect(getHashForTopic(null)).toBe("#ask");
    expect(getHashForTopic("venue")).toBe("#ask=venue");
    expect(getHashForTopic("dress_code")).toBe("#ask=dress-code");
    expect(getHashForTopic("timings")).toBe("#ask=timings");
    expect(getHashForTopic("gifts")).toBe("#ask=gifts");
  });
});
