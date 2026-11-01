import { describe, expect, it } from "vitest";
import { SITUATIONS, BADGES } from "@/lib/game/data";

describe("schoolsituaties", () => {
  it("bevat de telefoonvrije-school situatie", () => {
    expect(SITUATIONS.some((s) => s.titel === "Telefoonvrije school")).toBe(true);
  });
  it("bevat de roosterpaal situatie", () => {
    expect(SITUATIONS.some((s) => s.vraag.includes("roosterpaal"))).toBe(true);
  });
  it("heeft genoeg situaties voor ochtend en pauze over 5 dagen", () => {
    expect(SITUATIONS.length).toBeGreaterThanOrEqual(10);
  });
  it("heeft de combo-badge", () => {
    expect(BADGES["combo"]).toBeDefined();
  });
});

import { doelLokaal, initialState } from "@/lib/game/state";
describe("roosterwijziging", () => {
  it("geeft het nieuwe lokaal voor de gewijzigde les", () => {
    const st = { ...initialState, lessonIndex: 2, wijziging: { lesIndex: 2, lokaal: "C2.06", gecheckt: false } };
    expect(doelLokaal(st)).toBe("C2.06");
  });
  it("geeft niets voor een andere les", () => {
    const st = { ...initialState, lessonIndex: 1, wijziging: { lesIndex: 2, lokaal: "C2.06", gecheckt: false } };
    expect(doelLokaal(st)).toBeNull();
  });
});
