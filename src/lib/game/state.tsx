import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  BADGES,
  ROOM_LIST,
  HOMEWORK,
  SCHEDULE,
  SITUATIONS,
  SKILL_META,
  SUBJECTS,
  type SkillId,
} from "./data";
import { EVENT_BY_ID, LIVE_EVENTS, eventEffect, eventXp, planEvents, type GameId, type GeplandEvent } from "./events";

export type Phase = "setup" | "ochtend" | "les" | "avond" | "toets" | "klaar";

export type HomeworkState = {
  id: string;
  plannedDag: number | null;
  progress: number;
  completedDag: number | null;
  correct: number;
  totaal: number;
  /** XP voor het (op tijd) inplannen is al gegeven. */
  planXp?: boolean;
  /** De bonus-minigame van dit huiswerk is al gespeeld. */
  minigame?: boolean;
};

export type LogEntry = { dag: number; tekst: string; type: "goed" | "slecht" | "info" };

export type LastResult = {
  soort: "route";
  goed: boolean;
  lokaal: string;
  vak: string;
  itemOk: boolean;
  itemNaam: string;
  telaat: number;
  fouten: number;
  seconden: number;
} | null;

export type EventResultaat = { id: string; dag: number; score: number; punten: number };

export type GameState = {
  playerName: string;
  classType: string;
  phase: Phase;
  currentDag: number;
  minuten: number;
  currentLokaal: string;
  lessonIndex: number;
  backpack: string[];
  skills: Record<SkillId, number>;
  xp: number;
  badges: string[];
  homework: HomeworkState[];
  situationQueue: string[];
  pendingSituation: string | null;
  keuzes: { id: string; optie: number }[];
  lessenOpTijd: number;
  streak: number;
  wijziging: { lesIndex: number; lokaal: string; gecheckt: boolean } | null;
  besteStreak: number;
  lessenTeLaat: number;
  vergetenItems: number;
  geleerdOpDagen: number[];
  testScore: { correct: number; totaal: number } | null;
  lastResult: LastResult;
  log: LogEntry[];
  /* live events & speelhal */
  eventPlan: GeplandEvent[];
  pendingEvent: string | null;
  eventsGedaan: EventResultaat[];
  highscores: Partial<Record<GameId, number>>;
  gespeeld: GameId[];
  snelsteRoute: number | null;
};

const STORAGE_KEY = "brugklas-save-v1";

const startSkills: Record<SkillId, number> = {
  planning: 65,
  tijdmanagement: 68,
  organisatie: 66,
  leren: 62,
  zelfstandigheid: 67,
  verantwoordelijkheid: 66,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

export const initialState: GameState = {
  playerName: "",
  classType: "Brugklas",
  phase: "setup",
  currentDag: 0,
  minuten: 8 * 60 + 15,
  currentLokaal: "A0.02",
  lessonIndex: 0,
  backpack: [],
  skills: { ...startSkills },
  xp: 0,
  badges: [],
  homework: [],
  situationQueue: [],
  pendingSituation: null,
  keuzes: [],
  lessenOpTijd: 0,
  streak: 0,
  wijziging: null,
  besteStreak: 0,
  lessenTeLaat: 0,
  vergetenItems: 0,
  geleerdOpDagen: [],
  testScore: null,
  lastResult: null,
  log: [],
  eventPlan: [],
  pendingEvent: null,
  eventsGedaan: [],
  highscores: {},
  gespeeld: [],
  snelsteRoute: null,
};

export type Action =
  | { type: "SETUP"; naam: string; classType: string }
  | { type: "TOGGLE_ITEM"; item: string }
  | { type: "START_DAG" }
  | { type: "GA_NAAR_LOKAAL"; keuze: string; minutenOnderweg?: number; fouten?: number; seconden?: number }
  | { type: "STAR" }
  | { type: "CHECK_ROOSTERPAAL" }
  | { type: "CLEAR_RESULT" }
  | { type: "SITUATIE_ANTWOORD"; id: string; optie: number }
  | { type: "PLAN_HUISWERK"; id: string; dag: number | null }
  | { type: "HUISWERK_KLAAR"; id: string; correct: number; totaal: number }
  | { type: "LEREN" }
  | { type: "VOLGENDE_DAG" }
  | { type: "TOETS_KLAAR"; correct: number; totaal: number }
  | { type: "RESET" }
  | { type: "EVENT_KLAAR"; id: string; score: number; punten: number }
  | { type: "EVENT_START"; id: string }
  | { type: "SPEELHAL_SCORE"; game: GameId; punten: number }
  | { type: "BONUS_XP"; xp: number; tekst?: string; perfect?: boolean; huiswerk?: string }
  | { type: "HYDRATE"; state: GameState };

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function bump(skills: Record<SkillId, number>, effect: Partial<Record<SkillId, number>>) {
  const next = { ...skills };
  for (const key of Object.keys(effect) as SkillId[]) {
    next[key] = clamp(next[key] + (effect[key] ?? 0));
  }
  return next;
}

function withBadges(state: GameState): GameState {
  const badges = new Set(state.badges);
  if (state.lessenOpTijd >= 5) badges.add("optijd");
  const lessenGedaan = state.lessenOpTijd + state.lessenTeLaat;
  if (lessenGedaan >= 5 && state.vergetenItems === 0) badges.add("voorbereid");
  if (state.homework.length > 0) {
    const def = HOMEWORK;
    const allePlanned = state.homework.every((h) => {
      const d = def.find((x) => x.id === h.id)!;
      return h.plannedDag !== null && h.plannedDag <= d.deadlineDag;
    });
    if (allePlanned) badges.add("planner");
    if (state.homework.every((h) => h.completedDag !== null)) badges.add("doorzetter");
  }
  if (state.geleerdOpDagen.length >= 2) badges.add("slim");
  if (state.besteStreak >= 4) badges.add("combo");
  const goedeKeuzes = state.keuzes.filter((k) => SITUATIONS.find((s) => s.id === k.id)?.opties[k.optie]?.goed).length;
  if (goedeKeuzes >= 8) badges.add("wijs");
  for (const r of state.eventsGedaan) {
    const b = EVENT_BY_ID[r.id]?.badge;
    if (b && r.score >= b.minScore) badges.add(b.id);
  }
  if (LIVE_EVENTS.every((e) => state.eventsGedaan.some((r) => r.id === e.id))) badges.add("held");
  if (state.gespeeld.length >= 5) badges.add("arcade");
  if (state.snelsteRoute !== null && state.snelsteRoute <= 6) badges.add("snelheid");
  return { ...state, badges: [...badges].filter((b) => b in BADGES) };
}

function nextSituation(state: GameState): { queue: string[]; pending: string | null } {
  if (state.situationQueue.length === 0) return { queue: [], pending: null };
  const [first, ...rest] = state.situationQueue;
  return { queue: rest, pending: first ?? null };
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "SETUP":
      return withBadges({
        ...initialState,
        playerName: action.naam,
        classType: action.classType,
        phase: "ochtend",
        situationQueue: shuffle(SITUATIONS.map((s) => s.id)),
        eventPlan: planEvents(SCHEDULE.map((d) => d.length)),
        // speelhal-records blijven bewaard tussen weken
        highscores: state.highscores,
        gespeeld: state.gespeeld,
        homework: HOMEWORK.filter((h) => h.gegevenOpDag === 0).map((h) => ({
          id: h.id,
          plannedDag: null,
          progress: 0,
          completedDag: null,
          correct: 0,
          totaal: 0,
        })),
        log: [{ dag: 0, tekst: "Je eerste schoolweek is begonnen.", type: "info" }],
      });

    case "TOGGLE_ITEM": {
      // Tijdens de schooldag zit je rugzak dicht: inpakken doe je thuis.
      if (state.phase === "les") return state;
      const heeft = state.backpack.includes(action.item);
      return {
        ...state,
        backpack: heeft
          ? state.backpack.filter((i) => i !== action.item)
          : [...state.backpack, action.item],
      };
    }

    case "START_DAG": {
      const nodig = new Set((SCHEDULE[state.currentDag] ?? []).map((l) => SUBJECTS[l.subject].item));
      const compleet = [...nodig].every((i) => state.backpack.includes(i));
      const lessen = SCHEDULE[state.currentDag] ?? [];
      let wijziging: GameState["wijziging"] = null;
      if (lessen.length > 1 && Math.random() < 0.7) {
        const lesIndex = 1 + Math.floor(Math.random() * (lessen.length - 1));
        const oud = SUBJECTS[lessen[lesIndex]!.subject].lokaal;
        const opties = ROOM_LIST.filter((r) => r !== oud);
        wijziging = { lesIndex, lokaal: opties[Math.floor(Math.random() * opties.length)]!, gecheckt: false };
      }
      return withBadges({
        ...state,
        wijziging,
        phase: "les",
        minuten: 8 * 60 + 15,
        skills: bump(state.skills, { organisatie: compleet ? 4 : -4 }),
        xp: state.xp + (compleet ? 10 : 0),
        log: [
          ...state.log,
          {
            dag: state.currentDag,
            tekst: compleet
              ? "Je rugzak was helemaal goed ingepakt."
              : "Je bent begonnen met een onvolledige rugzak.",
            type: compleet ? "goed" : "slecht",
          },
        ],
      });
    }

    case "GA_NAAR_LOKAAL": {
      const les = SCHEDULE[state.currentDag]?.[state.lessonIndex];
      if (!les) return state;
      const vak = SUBJECTS[les.subject];
      const doel = doelLokaal(state) ?? vak.lokaal;
      const juistLokaal = action.keuze === doel;
      const fouten = action.fouten ?? 0;
      const onderweg = action.minutenOnderweg ?? 3;
      // verkeerd lokaal binnenlopen (oude flow) kost extra tijd
      const aankomst = state.minuten + onderweg + (juistLokaal ? 0 : 8);
      const telaat = Math.max(0, aankomst - les.minuten);
      const goed = juistLokaal && telaat === 0;
      const itemOk = state.backpack.includes(vak.item);

      let skills = bump(
        state.skills,
        goed ? { tijdmanagement: fouten === 0 ? 4 : 2 } : { tijdmanagement: telaat > 5 ? -8 : -5 },
      );
      skills = bump(skills, itemOk ? { organisatie: 2 } : { organisatie: -5, verantwoordelijkheid: -3 });
      if (fouten > 0) skills = bump(skills, { organisatie: -2 * Math.min(fouten, 3) });

      const lessonIndex = state.lessonIndex + 1;
      const dagLessen = SCHEDULE[state.currentDag] ?? [];
      const klaarMetDag = lessonIndex >= dagLessen.length;
      const laatsteDag = state.currentDag === SCHEDULE.length - 1;
      const volgende = dagLessen[lessonIndex];

      const streak = goed ? (state.streak ?? 0) + 1 : 0;
      const comboBonus = goed && streak >= 3 ? streak * 2 : 0;
      const seconden = action.seconden ?? null;
      const snelste =
        goed && seconden !== null
          ? Math.min(state.snelsteRoute ?? Number.POSITIVE_INFINITY, seconden)
          : state.snelsteRoute;
      let base: GameState = {
        ...state,
        streak,
        besteStreak: Math.max(state.besteStreak ?? 0, streak),
        skills,
        // na de les: 5 minuten wisseltijd voor de volgende les
        minuten: volgende ? volgende.minuten - 5 : les.minuten + 50,
        currentLokaal: doel,
        lessonIndex,
        lessenOpTijd: state.lessenOpTijd + (goed ? 1 : 0),
        lessenTeLaat: state.lessenTeLaat + (goed ? 0 : 1),
        vergetenItems: state.vergetenItems + (itemOk ? 0 : 1),
        xp: state.xp + (goed ? 15 : 2) + (itemOk ? 5 : 0) + comboBonus,
        snelsteRoute: Number.isFinite(snelste ?? NaN) ? snelste : state.snelsteRoute,
        lastResult: {
          soort: "route",
          goed,
          lokaal: doel,
          vak: vak.naam,
          itemOk,
          itemNaam: vak.itemNaam,
          telaat,
          fouten,
          seconden: seconden ?? 0,
        },
        log: [
          ...state.log,
          {
            dag: state.currentDag,
            tekst: goed
              ? `Op tijd bij ${vak.naam} in ${doel}.${comboBonus ? ` ⚡ ${streak}× op rij: +${comboBonus} XP!` : ""}`
              : `${telaat} minuten te laat bij ${vak.naam}${fouten ? ` (${fouten}× verkeerd lokaal)` : ""}.`,
            type: goed ? "goed" : "slecht",
          },
        ],
      };

      // Live event gepland bij deze les?
      const ev = state.eventPlan.find(
        (e) =>
          e.dag === state.currentDag &&
          e.lesIndex === lessonIndex &&
          !state.eventsGedaan.some((r) => r.id === e.id && r.dag === e.dag),
      );
      if (ev && !klaarMetDag) base = { ...base, pendingEvent: ev.id };

      // Grote pauze (na het 4e uur): soms gebeurt er iets onverwachts
      if (!klaarMetDag && lessonIndex === 4 && !base.pendingSituation) {
        const sit = nextSituation(base);
        base = { ...base, situationQueue: sit.queue, pendingSituation: sit.pending };
      }

      if (klaarMetDag) {
        const sit = nextSituation(base);
        base = {
          ...base,
          phase: laatsteDag ? "toets" : "avond",
          situationQueue: sit.queue,
          pendingSituation: sit.pending,
        };
      }

      return withBadges(base);
    }

    case "EVENT_START":
      return { ...state, pendingEvent: action.id };

    case "EVENT_KLAAR": {
      const def = EVENT_BY_ID[action.id];
      if (!def) return { ...state, pendingEvent: null };
      // dubbel klikken mag het event niet twee keer laten tellen
      if (state.eventsGedaan.some((r) => r.id === def.id && r.dag === state.currentDag)) {
        return { ...state, pendingEvent: null };
      }
      const score = Math.max(0, Math.min(1, action.score));
      const goed = score >= 0.5;
      const game = def.game;
      return withBadges({
        ...state,
        pendingEvent: null,
        skills: bump(state.skills, eventEffect(def, score)),
        xp: state.xp + eventXp(score),
        eventsGedaan: [...state.eventsGedaan, { id: def.id, dag: state.currentDag, score, punten: action.punten }],
        highscores: {
          ...state.highscores,
          [game]: Math.max(state.highscores[game] ?? 0, action.punten),
        },
        log: [
          ...state.log,
          {
            dag: state.currentDag,
            tekst: `${def.icon} ${def.titel.replace(/!$/, "")}: ${goed ? "goed afgehandeld" : "dat kon beter"} (${Math.round(score * 100)}%).`,
            type: goed ? "goed" : "slecht",
          },
        ],
      });
    }

    case "SPEELHAL_SCORE": {
      const oud = state.highscores[action.game] ?? 0;
      const record = action.punten > oud;
      return withBadges({
        ...state,
        highscores: record ? { ...state.highscores, [action.game]: action.punten } : state.highscores,
        gespeeld: state.gespeeld.includes(action.game) ? state.gespeeld : [...state.gespeeld, action.game],
        xp: state.xp + (record && state.playerName ? 5 : 0),
      });
    }

    case "BONUS_XP": {
      const badges = action.perfect ? [...new Set([...state.badges, "perfect"])] : state.badges;
      const hw = action.huiswerk ? state.homework.find((h) => h.id === action.huiswerk) : undefined;
      // De bonus-minigame van een huiswerkopdracht levert maar één keer XP op.
      if (hw?.minigame) return state;
      return withBadges({
        ...state,
        badges,
        homework: hw
          ? state.homework.map((h) => (h.id === hw.id ? { ...h, minigame: true } : h))
          : state.homework,
        xp: state.xp + Math.max(0, Math.round(action.xp)),
        log: action.tekst ? [...state.log, { dag: state.currentDag, tekst: action.tekst, type: "goed" }] : state.log,
      });
    }

    case "CHECK_ROOSTERPAAL": {
      if (!state.wijziging || state.wijziging.gecheckt) return state;
      return withBadges({
        ...state,
        wijziging: { ...state.wijziging, gecheckt: true },
        skills: bump(state.skills, { organisatie: 4 }),
        xp: state.xp + 8,
        log: [...state.log, { dag: state.currentDag, tekst: "Roosterwijziging gezien op de roosterpaal.", type: "goed" }],
      });
    }

    case "STAR":
      return { ...state, xp: state.xp + 2 };

    case "CLEAR_RESULT":
      return { ...state, lastResult: null };

    case "SITUATIE_ANTWOORD": {
      const sit = SITUATIONS.find((s) => s.id === action.id);
      if (!sit) return { ...state, pendingSituation: null };
      const optie = sit.opties[action.optie];
      if (!optie) return { ...state, pendingSituation: null };
      return withBadges({
        ...state,
        pendingSituation: null,
        skills: bump(state.skills, optie.effect),
        xp: state.xp + (optie.goed ? 10 : 2),
        keuzes: [...state.keuzes, { id: sit.id, optie: action.optie }],
        log: [
          ...state.log,
          {
            dag: state.currentDag,
            tekst: `${sit.titel}: ${optie.goed ? "goede keuze" : "dat pakte niet goed uit"}.`,
            type: optie.goed ? "goed" : "slecht",
          },
        ],
      });
    }

    case "PLAN_HUISWERK": {
      const def = HOMEWORK.find((h) => h.id === action.id);
      const hw = state.homework.find((h) => h.id === action.id);
      if (!def || !hw || hw.completedDag !== null) return state;
      if (action.dag !== null && (action.dag < state.currentDag || action.dag > SCHEDULE.length - 1)) return state;
      if (hw.plannedDag === action.dag) return state;
      // Planningseffect van een keuze: op tijd +4, te laat −4, niet gepland 0.
      // We verrekenen alleen het verschil met de vorige keuze, zodat steeds
      // opnieuw in- en uitplannen geen punten oplevert.
      const waarde = (dag: number | null) => (dag === null ? 0 : dag <= def.deadlineDag ? 4 : -4);
      const verschil = waarde(action.dag) - waarde(hw.plannedDag);
      const opTijd = action.dag !== null && action.dag <= def.deadlineDag;
      const xpErbij = opTijd && !hw.planXp ? 5 : 0;
      return withBadges({
        ...state,
        homework: state.homework.map((h) =>
          h.id === action.id ? { ...h, plannedDag: action.dag, planXp: h.planXp || opTijd } : h,
        ),
        skills: verschil === 0 ? state.skills : bump(state.skills, { planning: verschil }),
        xp: state.xp + xpErbij,
      });
    }

    case "HUISWERK_KLAAR": {
      const def = HOMEWORK.find((h) => h.id === action.id);
      const bestaand = state.homework.find((h) => h.id === action.id);
      if (!def || !bestaand || bestaand.completedDag !== null) return state;
      const ratio = action.totaal === 0 ? 0 : action.correct / action.totaal;
      const opTijd = state.currentDag <= def.deadlineDag;
      const zoalsGepland = state.homework.find((h) => h.id === action.id)?.plannedDag === state.currentDag;
      return withBadges({
        ...state,
        homework: state.homework.map((h) =>
          h.id === action.id
            ? {
                ...h,
                progress: 100,
                completedDag: state.currentDag,
                correct: action.correct,
                totaal: action.totaal,
              }
            : h,
        ),
        skills: bump(state.skills, {
          leren: Math.round(ratio * 9),
          verantwoordelijkheid: opTijd ? 5 : -6,
          planning: zoalsGepland ? 5 : 0,
          zelfstandigheid: 3,
        }),
        xp: state.xp + 20 + action.correct * 3,
        log: [
          ...state.log,
          {
            dag: state.currentDag,
            tekst: `Huiswerk ${SUBJECTS[def.subject].naam} afgerond (${action.correct}/${action.totaal}).`,
            type: opTijd ? "goed" : "slecht",
          },
        ],
      });
    }

    case "LEREN": {
      if (state.geleerdOpDagen.includes(state.currentDag)) return state;
      return withBadges({
        ...state,
        geleerdOpDagen: [...state.geleerdOpDagen, state.currentDag],
        skills: bump(state.skills, { leren: 7, planning: 2 }),
        xp: state.xp + 12,
        log: [
          ...state.log,
          { dag: state.currentDag, tekst: "Je hebt geleerd voor de toets.", type: "goed" },
        ],
      });
    }

    case "VOLGENDE_DAG": {
      const nieuweDag = state.currentDag + 1;
      let skills = state.skills;
      const log = [...state.log];

      for (const def of HOMEWORK) {
        const hw = state.homework.find((h) => h.id === def.id);
        if (!hw) continue;
        if (hw.completedDag === null && def.deadlineDag < nieuweDag) {
          skills = bump(skills, { verantwoordelijkheid: -10, planning: -6 });
          log.push({
            dag: state.currentDag,
            tekst: `Deadline gemist: ${SUBJECTS[def.subject].naam} — ${def.titel}.`,
            type: "slecht",
          });
        } else if (hw.completedDag === state.currentDag && hw.plannedDag === state.currentDag) {
          skills = bump(skills, { planning: 3 });
        }
      }

      const nieuwHuiswerk = HOMEWORK.filter(
        (h) => h.gegevenOpDag === nieuweDag && !state.homework.some((x) => x.id === h.id),
      ).map((h) => ({
        id: h.id,
        plannedDag: null,
        progress: 0,
        completedDag: null,
        correct: 0,
        totaal: 0,
      }));

      const ongepland = state.homework.filter((h) => h.plannedDag === null && h.completedDag === null);
      if (ongepland.length > 0) {
        skills = bump(skills, { planning: -4 });
        log.push({
          dag: nieuweDag,
          tekst: `Je hebt ${ongepland.length} taak(en) nog niet ingepland.`,
          type: "slecht",
        });
      }

      const sit = nextSituation(state);

      return withBadges({
        ...state,
        currentDag: nieuweDag,
        phase: "ochtend",
        minuten: 8 * 60 + 15,
        lessonIndex: 0,
        currentLokaal: "A0.02",
        skills,
        homework: [...state.homework, ...nieuwHuiswerk],
        situationQueue: sit.queue,
        pendingSituation: sit.pending,
        lastResult: null,
        wijziging: null,
        log,
      });
    }

    case "TOETS_KLAAR": {
      if (state.testScore || action.totaal <= 0) return state;
      const ratio = action.correct / action.totaal;
      return withBadges({
        ...state,
        testScore: { correct: action.correct, totaal: action.totaal },
        phase: "klaar",
        skills: bump(state.skills, {
          leren: Math.round((ratio - 0.5) * 20),
        }),
        xp: state.xp + action.correct * 8,
        log: [
          ...state.log,
          {
            dag: 4,
            tekst: `Toets afgerond: ${action.correct}/${action.totaal}.`,
            type: ratio >= 0.6 ? "goed" : "slecht",
          },
        ],
      });
    }

    case "RESET":
      return { ...initialState, highscores: state.highscores, gespeeld: state.gespeeld };

    default:
      return state;
  }
}

const PHASES: Phase[] = ["setup", "ochtend", "les", "avond", "toets", "klaar"];
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/**
 * Maak van een (mogelijk oude of kapotte) opgeslagen stand een geldige GameState.
 * Ontbrekende of foute velden krijgen hun standaardwaarde, zodat de app nooit
 * crasht op een oude save. Geeft null als er niets bruikbaars in zit.
 */
export function laadSave(raw: unknown): GameState | null {
  if (!isObj(raw) || typeof raw["playerName"] !== "string") return null;
  const basis: GameState = { ...initialState };
  const uit = { ...basis } as Record<string, unknown>;
  for (const key of Object.keys(basis) as (keyof GameState)[]) {
    const waarde = raw[key];
    const standaard = basis[key];
    if (waarde === undefined) continue;
    if (Array.isArray(standaard)) {
      if (Array.isArray(waarde)) uit[key] = waarde;
    } else if (typeof standaard === "number") {
      if (isNum(waarde)) uit[key] = waarde;
    } else if (typeof standaard === "string") {
      if (typeof waarde === "string") uit[key] = waarde;
    } else if (standaard === null) {
      // velden die null of een object/nummer mogen zijn
      uit[key] = waarde;
    } else if (isObj(standaard)) {
      if (isObj(waarde)) uit[key] = { ...standaard, ...waarde };
    }
  }
  const st = uit as GameState;
  const skills = { ...startSkills };
  for (const k of Object.keys(startSkills) as SkillId[]) {
    const v = st.skills[k];
    skills[k] = isNum(v) ? clamp(v) : startSkills[k];
  }
  const homework = st.homework.filter(
    (h): h is HomeworkState => isObj(h) && typeof h.id === "string" && HOMEWORK.some((d) => d.id === h.id),
  );
  return {
    ...st,
    skills,
    homework,
    phase: PHASES.includes(st.phase) ? st.phase : "setup",
    currentDag: Math.max(0, Math.min(SCHEDULE.length - 1, Math.floor(st.currentDag))),
    lessonIndex: Math.max(0, Math.floor(st.lessonIndex)),
    backpack: st.backpack.filter((i): i is string => typeof i === "string"),
    pendingEvent: typeof st.pendingEvent === "string" && EVENT_BY_ID[st.pendingEvent] ? st.pendingEvent : null,
    pendingSituation:
      typeof st.pendingSituation === "string" && SITUATIONS.some((s) => s.id === st.pendingSituation)
        ? st.pendingSituation
        : null,
    snelsteRoute: isNum(st.snelsteRoute) ? st.snelsteRoute : null,
    testScore:
      isObj(st.testScore) && isNum(st.testScore.correct) && isNum(st.testScore.totaal) && st.testScore.totaal > 0
        ? st.testScore
        : null,
    wijziging:
      isObj(st.wijziging) && isNum(st.wijziging.lesIndex) && typeof st.wijziging.lokaal === "string"
        ? { ...st.wijziging, gecheckt: !!st.wijziging.gecheckt }
        : null,
    lastResult: isObj(st.lastResult) && typeof st.lastResult.vak === "string" ? st.lastResult : null,
  };
}

const GameContext = createContext<{
  state: GameState;
  dispatch: Dispatch<Action>;
  /** true zodra een eventueel opgeslagen spel uit de browser is geladen. */
  geladen: boolean;
} | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const save = laadSave(JSON.parse(raw));
        if (save) dispatch({ type: "HYDRATE", state: save });
      }
    } catch {
      /* geen (leesbaar) opgeslagen spel */
    }
    setGeladen(true);
  }, []);

  useEffect(() => {
    // pas opslaan na het laden, anders overschrijven we een save met de beginstand
    if (!geladen) return;
    if (state.phase === "setup" && state.playerName === "") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* opslaan mislukt (bijv. privémodus) */
    }
  }, [state, geladen]);

  const value = useMemo(() => ({ state, dispatch, geladen }), [state, geladen]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame moet binnen GameProvider gebruikt worden");
  return ctx;
}

export function clearSave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/* ---------- afgeleide waarden ---------- */

export const fmtTijd = (minuten: number) =>
  `${String(Math.floor(minuten / 60)).padStart(2, "0")}:${String(minuten % 60).padStart(2, "0")}`;

export function volgendeLes(state: GameState) {
  const dag = SCHEDULE[state.currentDag];
  if (!dag) return null;
  return dag[state.lessonIndex] ?? null;
}

export function gemiddeldeScore(skills: Record<SkillId, number>) {
  const keys = Object.keys(SKILL_META) as SkillId[];
  return Math.round(keys.reduce((s, k) => s + skills[k], 0) / keys.length);
}

/** Lokaal waar de huidige les écht is, als er een roosterwijziging is. */
export function doelLokaal(state: GameState): string | null {
  const w = state.wijziging;
  return w && w.lesIndex === state.lessonIndex ? w.lokaal : null;
}

/** Heeft de huidige les een wijziging die de speler nog niet gezien heeft? */
export function onbekendeWijziging(state: GameState) {
  return !!doelLokaal(state) && !state.wijziging?.gecheckt;
}
