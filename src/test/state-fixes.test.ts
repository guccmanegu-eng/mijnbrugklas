import { describe, expect, it } from "vitest";
import { normaliseer } from "@/lib/game/antwoord";
import { EXERCISES, TEST_QUESTIONS } from "@/lib/game/data";
import { schud } from "@/lib/game/random";
import { initialState, laadSave, reducer, type GameState } from "@/lib/game/state";

const nieuweWeek = (): GameState =>
  reducer(initialState, { type: "SETUP", naam: "Sam", classType: "Havo/vwo" });

describe("planning kan niet eindeloos XP opleveren", () => {
  it("geeft één keer XP en geen extra planningspunten bij steeds opnieuw inplannen", () => {
    let st = nieuweWeek();
    const xp0 = st.xp;
    const planning0 = st.skills.planning;
    for (let i = 0; i < 20; i++) {
      st = reducer(st, { type: "PLAN_HUISWERK", id: "nl-h3", dag: 0 });
      st = reducer(st, { type: "PLAN_HUISWERK", id: "nl-h3", dag: null });
    }
    st = reducer(st, { type: "PLAN_HUISWERK", id: "nl-h3", dag: 0 });
    expect(st.xp - xp0).toBe(5);
    expect(st.skills.planning - planning0).toBe(4);
  });

  it("verrekent het verschil als je verplaatst naar na de deadline", () => {
    let st = nieuweWeek();
    const planning0 = st.skills.planning;
    st = reducer(st, { type: "PLAN_HUISWERK", id: "nl-h3", dag: 1 }); // deadline = dinsdag (1)
    st = reducer(st, { type: "PLAN_HUISWERK", id: "nl-h3", dag: 3 });
    expect(st.skills.planning - planning0).toBe(-4);
  });

  it("negeert inplannen op een dag die al voorbij is", () => {
    let st: GameState = { ...nieuweWeek(), currentDag: 2 };
    const voor = st;
    st = reducer(st, { type: "PLAN_HUISWERK", id: "wi-opdr", dag: 1 });
    expect(st).toBe(voor);
  });
});

describe("huiswerk", () => {
  it("de bonus-minigame levert maar één keer XP op", () => {
    let st = nieuweWeek();
    st = reducer(st, { type: "BONUS_XP", xp: 15, huiswerk: "en-woorden" });
    const na1 = st.xp;
    st = reducer(st, { type: "BONUS_XP", xp: 15, huiswerk: "en-woorden" });
    expect(st.xp).toBe(na1);
    expect(st.homework.find((h) => h.id === "en-woorden")?.minigame).toBe(true);
  });

  it("hetzelfde huiswerk twee keer inleveren telt niet dubbel", () => {
    let st = nieuweWeek();
    st = reducer(st, { type: "HUISWERK_KLAAR", id: "nl-h3", correct: 10, totaal: 13 });
    const na1 = st;
    st = reducer(st, { type: "HUISWERK_KLAAR", id: "nl-h3", correct: 13, totaal: 13 });
    expect(st).toBe(na1);
  });
});

describe("rugzak", () => {
  it("zit dicht tijdens de schooldag", () => {
    let st = nieuweWeek();
    st = reducer(st, { type: "START_DAG" });
    expect(st.phase).toBe("les");
    const na = reducer(st, { type: "TOGGLE_ITEM", item: "nl-boek" });
    expect(na.backpack).toEqual(st.backpack);
  });

  it("kan 's ochtends wel ingepakt worden", () => {
    const st = reducer(nieuweWeek(), { type: "TOGGLE_ITEM", item: "nl-boek" });
    expect(st.backpack).toContain("nl-boek");
  });
});

describe("live events en toets", () => {
  it("een event telt maar één keer, ook bij dubbelklikken", () => {
    let st: GameState = { ...nieuweWeek(), pendingEvent: "wesp" };
    st = reducer(st, { type: "EVENT_KLAAR", id: "wesp", score: 1, punten: 10 });
    const na1 = st.xp;
    st = reducer(st, { type: "EVENT_KLAAR", id: "wesp", score: 1, punten: 10 });
    expect(st.xp).toBe(na1);
    expect(st.eventsGedaan.filter((e) => e.id === "wesp")).toHaveLength(1);
  });

  it("de toets kan maar één keer gemaakt worden", () => {
    let st: GameState = { ...nieuweWeek(), phase: "toets" };
    st = reducer(st, { type: "TOETS_KLAAR", correct: 6, totaal: 12 });
    const na1 = st;
    st = reducer(st, { type: "TOETS_KLAAR", correct: 12, totaal: 12 });
    expect(st).toBe(na1);
  });
});

describe("opgeslagen spel laden", () => {
  it("weigert onzin", () => {
    expect(laadSave(null)).toBeNull();
    expect(laadSave("hallo")).toBeNull();
    expect(laadSave({ xp: 5 })).toBeNull();
  });

  it("vult ontbrekende velden aan en herstelt kapotte waarden", () => {
    const st = laadSave({
      playerName: "Noor",
      phase: "onzin",
      currentDag: 99,
      skills: { planning: 250, leren: "veel" },
      homework: [{ id: "bestaat-niet" }, { id: "nl-h3", plannedDag: 0, progress: 0, completedDag: null, correct: 0, totaal: 0 }],
      testScore: { correct: 3 },
      pendingEvent: "bestaat-niet",
    })!;
    expect(st.playerName).toBe("Noor");
    expect(st.phase).toBe("setup");
    expect(st.currentDag).toBe(4);
    expect(st.skills.planning).toBe(100);
    expect(st.skills.leren).toBe(initialState.skills.leren);
    expect(st.skills.organisatie).toBe(initialState.skills.organisatie);
    expect(st.homework.map((h) => h.id)).toEqual(["nl-h3"]);
    expect(st.testScore).toBeNull();
    expect(st.pendingEvent).toBeNull();
    expect(st.eventPlan).toEqual([]);
  });

  it("laat een gewone save ongemoeid", () => {
    const week = nieuweWeek();
    const terug = laadSave(JSON.parse(JSON.stringify(week)));
    expect(terug).toEqual(week);
  });
});

describe("antwoorden nakijken", () => {
  it("accepteert slimme aanhalingstekens, het minteken en leestekens aan het eind", () => {
    expect(normaliseer("I’m twelve years old.")).toBe(normaliseer("i'm twelve years old"));
    expect(normaliseer("−7")).toBe(normaliseer("-7"));
    expect(normaliseer("3.46")).toBe(normaliseer("3,46"));
    expect(normaliseer("x = 6")).toBe(normaliseer("x=6"));
    expect(normaliseer("€ 51,00")).toBe(normaliseer("51"));
    expect(normaliseer("May I go to the toilet?")).toBe(normaliseer("may i go to the toilet"));
  });

  it("keurt een fout antwoord nog steeds af", () => {
    expect(normaliseer("34,6")).not.toBe(normaliseer("3,46"));
    expect(normaliseer("homework")).not.toBe(normaliseer("housework"));
  });

  it("elke open vraag heeft minstens één antwoord", () => {
    for (const ex of Object.values(EXERCISES))
      for (const v of ex.vragen) if (v.open) expect(v.antwoorden.length).toBeGreaterThan(0);
  });

  it("elke meerkeuzevraag wijst naar een bestaande optie", () => {
    const alle = [...TEST_QUESTIONS, ...Object.values(EXERCISES).flatMap((e) => e.vragen)];
    for (const v of alle) if (!v.open) expect(v.opties[v.juist]).toBeDefined();
  });
});

describe("schudden", () => {
  it("houdt alle elementen en verandert het origineel niet", () => {
    const lijst = [1, 2, 3, 4, 5, 6];
    const uit = schud(lijst);
    expect([...uit].sort()).toEqual(lijst);
    expect(lijst).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
