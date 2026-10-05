import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  BADGES,
  HOMEWORK,
  SCHEDULE,
  SITUATIONS,
  SKILL_META,
  SUBJECTS,
  type SkillId,
} from "./data";

export type Phase = "setup" | "ochtend" | "les" | "avond" | "toets" | "klaar";

export type HomeworkState = {
  id: string;
  plannedDag: number | null;
  progress: number;
  completedDag: number | null;
  correct: number;
  totaal: number;
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
} | null;

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
  lessenTeLaat: number;
  vergetenItems: number;
  geleerdOpDagen: number[];
  testScore: { correct: number; totaal: number } | null;
  lastResult: LastResult;
  log: LogEntry[];
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
  lessenTeLaat: 0,
  vergetenItems: 0,
  geleerdOpDagen: [],
  testScore: null,
  lastResult: null,
  log: [],
};

export type Action =
  | { type: "SETUP"; naam: string; classType: string }
  | { type: "TOGGLE_ITEM"; item: string }
  | { type: "START_DAG" }
  | { type: "GA_NAAR_LOKAAL"; keuze: string }
  | { type: "STAR" }
  | { type: "CLEAR_RESULT" }
  | { type: "SITUATIE_ANTWOORD"; id: string; optie: number }
  | { type: "PLAN_HUISWERK"; id: string; dag: number | null }
  | { type: "HUISWERK_KLAAR"; id: string; correct: number; totaal: number }
  | { type: "LEREN" }
  | { type: "VOLGENDE_DAG" }
  | { type: "TOETS_KLAAR"; correct: number; totaal: number }
  | { type: "RESET" }
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
  return { ...state, badges: [...badges].filter((b) => b in BADGES) };
}

function nextSituation(state: GameState): { queue: string[]; pending: string | null } {
  if (state.situationQueue.length === 0) return { queue: [], pending: null };
  const [first, ...rest] = state.situationQueue;
  return { queue: rest, pending: first ?? null };
}

function reducer(state: GameState, action: Action): GameState {
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
      return withBadges({
        ...state,
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
      const goed = action.keuze === vak.lokaal;
      const nieuweTijd = goed
        ? Math.max(state.minuten + 3, les.minuten)
        : state.minuten + 11;
      const telaat = goed ? 0 : Math.max(0, nieuweTijd - les.minuten);
      const itemOk = state.backpack.includes(vak.item);

      let skills = bump(state.skills, goed ? { tijdmanagement: 4 } : { tijdmanagement: -7 });
      skills = bump(skills, itemOk ? { organisatie: 2 } : { organisatie: -5, verantwoordelijkheid: -3 });

      const lessonIndex = state.lessonIndex + 1;
      const klaarMetDag = lessonIndex >= (SCHEDULE[state.currentDag]?.length ?? 0);
      const laatsteDag = state.currentDag === SCHEDULE.length - 1;

      let base: GameState = {
        ...state,
        skills,
        minuten: goed ? Math.max(nieuweTijd, les.minuten) : nieuweTijd,
        currentLokaal: vak.lokaal,
        lessonIndex,
        lessenOpTijd: state.lessenOpTijd + (goed ? 1 : 0),
        lessenTeLaat: state.lessenTeLaat + (goed ? 0 : 1),
        vergetenItems: state.vergetenItems + (itemOk ? 0 : 1),
        xp: state.xp + (goed ? 15 : 2) + (itemOk ? 5 : 0),
        lastResult: {
          soort: "route",
          goed,
          lokaal: vak.lokaal,
          vak: vak.naam,
          itemOk,
          itemNaam: vak.itemNaam,
          telaat,
        },
        log: [
          ...state.log,
          {
            dag: state.currentDag,
            tekst: goed
              ? `Op tijd bij ${vak.naam} in ${vak.lokaal}.`
              : `${telaat} minuten te laat bij ${vak.naam}.`,
            type: goed ? "goed" : "slecht",
          },
        ],
      };

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
      if (!def) return state;
      const opTijd = action.dag !== null && action.dag <= def.deadlineDag;
      return withBadges({
        ...state,
        homework: state.homework.map((h) =>
          h.id === action.id ? { ...h, plannedDag: action.dag } : h,
        ),
        skills: bump(state.skills, action.dag === null ? {} : { planning: opTijd ? 4 : -4 }),
        xp: state.xp + (opTijd ? 5 : 0),
      });
    }

    case "HUISWERK_KLAAR": {
      const def = HOMEWORK.find((h) => h.id === action.id);
      if (!def) return state;
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
        log,
      });
    }

    case "TOETS_KLAAR": {
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
      return initialState;

    default:
      return state;
  }
}

const GameContext = createContext<{ state: GameState; dispatch: Dispatch<Action> } | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GameState;
        if (parsed && typeof parsed.playerName === "string") {
          dispatch({ type: "HYDRATE", state: { ...initialState, ...parsed } });
        }
      }
    } catch {
      /* geen opgeslagen spel */
    }
  }, []);

  useEffect(() => {
    if (state.phase === "setup" && state.playerName === "") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* opslaan mislukt */
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
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
