import { describe, expect, it } from "vitest";
import { BADGES, HOMEWORK, SCHEDULE, SUBJECTS } from "@/lib/game/data";
import {
  ARCADE,
  LIVE_EVENTS,
  eventEffect,
  levelInfo,
  planEvents,
  sterren,
} from "@/lib/game/events";
import { initialState, reducer, type GameState } from "@/lib/game/state";

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

describe("live events", () => {
  it("heeft een brandalarm met evacuatie-minigame", () => {
    const brand = LIVE_EVENTS.find((e) => e.id === "brand");
    expect(brand?.game).toBe("evacuatie");
    expect(brand?.alarm).toBe(true);
  });

  it("plant elk event precies één keer, op een bestaande les", () => {
    for (let s = 1; s < 40; s++) {
      const plan = planEvents(
        SCHEDULE.map((d) => d.length),
        seeded(s),
      );
      const ids = plan.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toContain("brand");
      expect(ids).toContain("mentor");
      expect(plan.length).toBeGreaterThanOrEqual(LIVE_EVENTS.length - 1);
      for (const p of plan) {
        expect(p.lesIndex).toBeGreaterThan(0);
        expect(p.lesIndex).toBeLessThan(SCHEDULE[p.dag]!.length);
      }
      const brand = plan.find((p) => p.id === "brand")!;
      expect([1, 2]).toContain(brand.dag);
    }
  });

  it("geeft een beter effect bij een hogere score", () => {
    const brand = LIVE_EVENTS[0]!;
    const goed = eventEffect(brand, 1);
    const slecht = eventEffect(brand, 0);
    expect(goed.verantwoordelijkheid!).toBeGreaterThan(0);
    expect(slecht.verantwoordelijkheid!).toBeLessThan(0);
  });

  it("geeft sterren op basis van score", () => {
    expect(sterren(1)).toBe(3);
    expect(sterren(0.6)).toBe(2);
    expect(sterren(0.3)).toBe(1);
    expect(sterren(0)).toBe(0);
  });

  it("elke event-badge bestaat", () => {
    for (const e of LIVE_EVENTS) if (e.badge) expect(BADGES[e.badge.id]).toBeDefined();
  });

  it("speelhal bevat elke event-game", () => {
    for (const e of LIVE_EVENTS) expect(ARCADE.some((a) => a.id === e.game)).toBe(true);
  });
});

describe("levels", () => {
  it("start op level 1 en stijgt met XP", () => {
    expect(levelInfo(0).level).toBe(1);
    expect(levelInfo(100).level).toBe(2);
    expect(levelInfo(300).level).toBe(3);
    expect(levelInfo(99).pct).toBeLessThan(100);
  });
});

describe("reducer", () => {
  const start = (): GameState =>
    reducer(initialState, { type: "SETUP", naam: "Sam", classType: "Brugklas" });

  it("SETUP plant de events van de week", () => {
    const st = start();
    expect(st.eventPlan.length).toBeGreaterThan(5);
    expect(st.pendingEvent).toBeNull();
  });

  it("op tijd aankomen geeft XP; te lang lopen maakt je te laat", () => {
    let st = reducer(start(), { type: "START_DAG" });
    st = { ...st, wijziging: null };
    const les = SCHEDULE[0]![0]!;
    const vak = SUBJECTS[les.subject];
    const opTijd = reducer(st, {
      type: "GA_NAAR_LOKAAL",
      keuze: vak.lokaal,
      minutenOnderweg: 3,
      fouten: 0,
      seconden: 5,
    });
    expect(opTijd.lastResult?.goed).toBe(true);
    expect(opTijd.lessenOpTijd).toBe(1);
    expect(opTijd.snelsteRoute).toBe(5);
    expect(opTijd.badges).toContain("snelheid");

    const teLaat = reducer(st, {
      type: "GA_NAAR_LOKAAL",
      keuze: vak.lokaal,
      minutenOnderweg: 12,
      fouten: 2,
      seconden: 30,
    });
    expect(teLaat.lastResult?.goed).toBe(false);
    expect(teLaat.lastResult?.telaat).toBe(7);
    expect(teLaat.lessenTeLaat).toBe(1);
  });

  it("na een les heb je 5 minuten wisseltijd voor de volgende", () => {
    let st = reducer(start(), { type: "START_DAG" });
    st = { ...st, wijziging: null };
    const vak = SUBJECTS[SCHEDULE[0]![0]!.subject];
    st = reducer(st, { type: "GA_NAAR_LOKAAL", keuze: vak.lokaal, minutenOnderweg: 2 });
    expect(SCHEDULE[0]![1]!.minuten - st.minuten).toBe(5);
  });

  it("start een gepland event bij de juiste les", () => {
    let st = reducer(start(), { type: "START_DAG" });
    st = { ...st, wijziging: null, eventPlan: [{ dag: 0, lesIndex: 1, id: "wesp" }] };
    const vak = SUBJECTS[SCHEDULE[0]![0]!.subject];
    st = reducer(st, { type: "GA_NAAR_LOKAAL", keuze: vak.lokaal, minutenOnderweg: 2 });
    expect(st.pendingEvent).toBe("wesp");
    const xp = st.xp;
    st = reducer(st, { type: "EVENT_KLAAR", id: "wesp", score: 0.9, punten: 90 });
    expect(st.pendingEvent).toBeNull();
    expect(st.xp).toBeGreaterThan(xp);
    expect(st.highscores.wesp).toBe(90);
    expect(st.eventsGedaan).toHaveLength(1);
  });

  it("brandweer-badge bij een goede evacuatie", () => {
    const st = reducer(start(), { type: "EVENT_KLAAR", id: "brand", score: 0.8, punten: 150 });
    expect(st.badges).toContain("brandweer");
  });

  it("speelhal: alleen een record levert XP op", () => {
    let st = start();
    st = reducer(st, { type: "SPEELHAL_SCORE", game: "penalty", punten: 60 });
    const xp = st.xp;
    st = reducer(st, { type: "SPEELHAL_SCORE", game: "penalty", punten: 40 });
    expect(st.xp).toBe(xp);
    expect(st.highscores.penalty).toBe(60);
    expect(st.gespeeld).toEqual(["penalty"]);
  });

  it("records blijven bewaard na opnieuw beginnen", () => {
    let st = reducer(start(), { type: "SPEELHAL_SCORE", game: "kluis", punten: 75 });
    st = reducer(st, { type: "RESET" });
    expect(st.highscores.kluis).toBe(75);
  });

  it("biologie-huiswerk wordt op dinsdag opgegeven", () => {
    let st = start();
    expect(st.homework.some((h) => h.id === "bio-leven")).toBe(false);
    st = reducer({ ...st, phase: "avond" }, { type: "VOLGENDE_DAG" });
    expect(st.homework.some((h) => h.id === "bio-leven")).toBe(true);
    expect(HOMEWORK.find((h) => h.id === "bio-leven")?.subject).toBe("biologie");
  });
});
