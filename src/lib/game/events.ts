import type { SkillId } from "./data";

/* ========================================================================
 * Live events — dingen die zomaar tijdens de schooldag gebeuren.
 * Elk event heeft een eigen minigame. Hoe beter je score, hoe beter het
 * effect op je vaardigheden.
 * ===================================================================== */

export type GameId =
  | "evacuatie"
  | "stroom"
  | "kantine"
  | "afval"
  | "penalty"
  | "kluis"
  | "wesp"
  | "memory"
  | "woordregen"
  | "rekenrace"
  | "fietsen";

/** Wat elke minigame teruggeeft. score = 0..1, punten = ruwe score voor highscores. */
export type MiniResult = { score: number; punten: number; tekst: string };

export type EventMoment = "les" | "pauze";

export type LiveEventDef = {
  id: string;
  icon: string;
  titel: string;
  kop: string;
  alarm?: boolean;
  toon: "rose" | "amber" | "brand" | "mint";
  moment: EventMoment;
  intro: string;
  regels: string[];
  game: GameId;
  effect: Partial<Record<SkillId, number>>;
  tip: string;
  badge?: { id: string; minScore: number };
};

export const LIVE_EVENTS: LiveEventDef[] = [
  {
    id: "brand",
    icon: "🔥",
    titel: "BRANDALARM!",
    kop: "Er is brand in vleugel C",
    alarm: true,
    toon: "rose",
    moment: "les",
    intro:
      "Midden in de les gaat het brandalarm af. Dit is géén oefening: er komt rook uit het practicumlokaal in vleugel C. Je docent zegt: 'Alles laten liggen, rustig naar buiten!'",
    regels: [
      "Volg de groene nooduitgang-bordjes naar de verzamelplaats.",
      "Vermijd vuur en rook — rook maakt je trager.",
      "Help verdwaalde klasgenoten (loop tegen ze aan) voor bonuspunten.",
      "Nooit de lift nemen en geen spullen ophalen!",
    ],
    game: "evacuatie",
    effect: { verantwoordelijkheid: 9, zelfstandigheid: 6 },
    tip: "Bij een echt brandalarm: alles laten liggen, niet rennen, volg je docent en de groene bordjes, en meld je op de verzamelplaats.",
    badge: { id: "brandweer", minScore: 0.75 },
  },
  {
    id: "stroom",
    icon: "⚡",
    titel: "Stroomstoring!",
    kop: "Alle lichten zijn uit",
    toon: "amber",
    moment: "les",
    intro:
      "Plop. Het hele gebouw wordt donker. De conciërge roept: 'Wie helpt me even? In de kelder liggen vier reservezekeringen, maar ik zie geen hand voor ogen!' Jij krijgt de zaklamp.",
    regels: [
      "Je ziet alleen wat je zaklamp verlicht.",
      "Vind de 4 zekeringen 🔋 en breng ze naar de meterkast ⚡.",
      "Hoe sneller, hoe meer punten.",
    ],
    game: "stroom",
    effect: { zelfstandigheid: 7, organisatie: 4 },
    tip: "Blijf rustig als er iets onverwachts gebeurt en luister naar wat de docent of conciërge zegt.",
  },
  {
    id: "kantine",
    icon: "🥪",
    titel: "Kantine-rush",
    kop: "Iedereen rent naar de kantine",
    toon: "mint",
    moment: "pauze",
    intro:
      "De bel gaat en de halve school stormt naar de kantine. Je hebt maar één pauze en een lege maag. Vang een gezonde lunch op je dienblad!",
    regels: [
      "Beweeg je dienblad met ← → of A D (of sleep met je vinger).",
      "Gezond eten = punten. Energiedrank en snoep = minpunten.",
      "Laat niet te veel gezond eten vallen!",
    ],
    game: "kantine",
    effect: { organisatie: 4, verantwoordelijkheid: 4 },
    tip: "Neem je lunch mee van huis of weet wat je wilt kopen, dan sta je niet je hele pauze in de rij.",
  },
  {
    id: "afval",
    icon: "♻️",
    titel: "Prikdienst",
    kop: "Jouw klas heeft corvee",
    toon: "mint",
    moment: "pauze",
    intro:
      "Op het Martinuscollege houdt elke klas om de beurt het schoolplein schoon. Vandaag is jouw klas aan de beurt. De mentor geeft je een grijper en vier afvalbakken.",
    regels: [
      "Sorteer elk stuk afval in de goede bak.",
      "Papier, plastic & blik (PMD), GFT of restafval.",
      "Snel én goed = combo-bonus.",
    ],
    game: "afval",
    effect: { verantwoordelijkheid: 7, organisatie: 2 },
    tip: "Corvee is niet leuk, maar samen houd je de school schoon. En een schone aula is fijner voor iedereen.",
  },
  {
    id: "penalty",
    icon: "⚽",
    titel: "Pauzetoernooi",
    kop: "1B tegen 1C — penalty's!",
    toon: "brand",
    moment: "pauze",
    intro:
      "In de pauze speelt jouw klas de finale van het pauzetoernooi. Het staat 2–2 en de bel gaat zo. Jij mag de penalty's nemen. Iedereen kijkt…",
    regels: [
      "Klik om te richten (de pijl beweegt heen en weer).",
      "Klik nog een keer voor de kracht.",
      "Te hard = over, te zacht = keeper heeft hem. 5 pogingen.",
    ],
    game: "penalty",
    effect: { zelfstandigheid: 4, verantwoordelijkheid: 2 },
    tip: "Meedoen met pauze-activiteiten is een super manier om nieuwe vrienden te maken.",
  },
  {
    id: "kluis",
    icon: "🔐",
    titel: "Kluis op slot",
    kop: "Je code werkt niet meer",
    toon: "amber",
    moment: "pauze",
    intro:
      "Na een update van het kluissysteem zijn alle codes gereset. Je boeken liggen erin en de volgende les begint zo! De conciërge zegt: 'Ik geef je hints, maar raden moet je zelf.'",
    regels: [
      "Raad de code van 3 cijfers (0–9, geen dubbele).",
      "🟢 = goed cijfer op de goede plek.",
      "🟡 = goed cijfer op de verkeerde plek.",
      "Je hebt 7 pogingen.",
    ],
    game: "kluis",
    effect: { organisatie: 5, zelfstandigheid: 4 },
    tip: "Schrijf je kluiscode achterin je agenda. Niet op je hand!",
    badge: { id: "kluiskraker", minScore: 0.7 },
  },
  {
    id: "wesp",
    icon: "🐝",
    titel: "Wesp in de klas!",
    kop: "Paniek bij de achterste rij",
    toon: "amber",
    moment: "les",
    intro:
      "Er vliegt een wesp door het open raam naar binnen. De halve klas gilt. Je docent geeft jou een bekertje: 'Vang hem rustig, dan zetten we hem buiten.'",
    regels: [
      "Klik op de wesp 🐝 om hem te vangen.",
      "Raak géén klasgenoten 🧑‍🎓 — dat kost punten.",
      "Je hebt 20 seconden.",
    ],
    game: "wesp",
    effect: { zelfstandigheid: 4, verantwoordelijkheid: 3 },
    tip: "Rustig blijven werkt beter dan wild meppen — bij wespen én bij stress.",
  },
  {
    id: "mentor",
    icon: "🧑‍🏫",
    titel: "Mentoruur",
    kop: "Ken jij je rooster al?",
    toon: "brand",
    moment: "les",
    intro:
      "Je mentor doet een spelletje met de klas: 'Wie weet al welk vak in welk lokaal is? Wie het snelst alle paren vindt, wint!'",
    regels: [
      "Draai steeds twee kaartjes om.",
      "Zoek het vak dat bij het lokaal hoort.",
      "Hoe minder beurten, hoe beter.",
    ],
    game: "memory",
    effect: { organisatie: 5, leren: 3 },
    tip: "Weet je je lokalen uit je hoofd? Dan hoef je minder vaak naar de roosterpaal te rennen.",
  },
  {
    id: "fiets",
    icon: "🚲",
    titel: "Te laat voor de bus",
    kop: "Je moet vandaag fietsen",
    toon: "brand",
    moment: "les",
    intro:
      "De conciërge komt de klas binnen: 'De schoolbus van vanmiddag rijdt niet.' Na school moet je dus zelf naar huis fietsen over de Grootebroekse dijk. Oefen alvast in je hoofd: ontwijk alles op je pad!",
    regels: [
      "Wissel van baan met ← → of A D (of tik links/rechts).",
      "Ontwijk tractors, schapen en plassen.",
      "Pak de ⭐ voor extra punten. Je hebt 3 levens.",
    ],
    game: "fietsen",
    effect: { zelfstandigheid: 5, verantwoordelijkheid: 3 },
    tip: "Fiets je naar school? Check 's avonds je banden en licht, en ga op tijd van huis.",
  },
];

export const EVENT_BY_ID: Record<string, LiveEventDef> = Object.fromEntries(
  LIVE_EVENTS.map((e) => [e.id, e]),
);

/* ---------- Speelhal (alle minigames vrij spelen) ---------- */

export type ArcadeGame = { id: GameId; naam: string; icon: string; uitleg: string };

export const ARCADE: ArcadeGame[] = [
  {
    id: "evacuatie",
    naam: "Brand-evacuatie",
    icon: "🔥",
    uitleg: "Breng jezelf en je klasgenoten veilig naar buiten.",
  },
  {
    id: "fietsen",
    naam: "Dijk-fietser",
    icon: "🚲",
    uitleg: "Fiets naar huis en ontwijk alles op de dijk.",
  },
  {
    id: "kantine",
    naam: "Kantine-rush",
    icon: "🥪",
    uitleg: "Vang een gezonde lunch op je dienblad.",
  },
  { id: "afval", naam: "Afval sorteren", icon: "♻️", uitleg: "Elk stuk afval in de goede bak." },
  { id: "penalty", naam: "Penalty-shootout", icon: "⚽", uitleg: "Richten, kracht, scoren!" },
  { id: "wesp", naam: "Wespenvanger", icon: "🐝", uitleg: "Vang de wesp, niet je klasgenoten." },
  {
    id: "stroom",
    naam: "Zaklamp-zoektocht",
    icon: "⚡",
    uitleg: "Vind de zekeringen in het donker.",
  },
  { id: "kluis", naam: "Kluiskraker", icon: "🔐", uitleg: "Kraak de code met slimme hints." },
  { id: "memory", naam: "Rooster-memory", icon: "🧠", uitleg: "Koppel elk vak aan zijn lokaal." },
  {
    id: "woordregen",
    naam: "Woordenregen",
    icon: "🌧️",
    uitleg: "Typ de Engelse vertaling voordat het woord de grond raakt.",
  },
  {
    id: "rekenrace",
    naam: "Rekenrace",
    icon: "➗",
    uitleg: "Zoveel mogelijk sommen in 45 seconden.",
  },
];

/* ---------- Effect-berekening ---------- */

/** Schaal het effect: score 1 → vol effect, score 0 → negatief. */
export function eventEffect(def: LiveEventDef, score: number): Partial<Record<SkillId, number>> {
  const factor = (Math.max(0, Math.min(1, score)) - 0.35) * 1.55;
  const uit: Partial<Record<SkillId, number>> = {};
  for (const k of Object.keys(def.effect) as SkillId[]) {
    uit[k] = Math.round((def.effect[k] ?? 0) * factor);
  }
  return uit;
}

export const eventXp = (score: number) => 10 + Math.round(Math.max(0, Math.min(1, score)) * 30);

export const sterren = (score: number) =>
  score >= 0.85 ? 3 : score >= 0.55 ? 2 : score > 0.15 ? 1 : 0;

/* ---------- Weekplanning van events ---------- */

export type GeplandEvent = { dag: number; lesIndex: number; id: string };

/**
 * Verdeel de events over de week.
 * - Maandag: mentoruur (rustige start).
 * - Brand op dinsdag of woensdag.
 * - Pauze-events vallen na de ochtendpauze (les 3) of grote pauze (les 5).
 */
export function planEvents(
  lessenPerDag: number[],
  rnd: () => number = Math.random,
): GeplandEvent[] {
  const shuffle = <T>(a: T[]) => {
    const c = [...a];
    for (let i = c.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [c[i], c[j]] = [c[j] as T, c[i] as T];
    }
    return c;
  };

  const plan: GeplandEvent[] = [];
  const bezet = new Set<string>();
  const vrij = (dag: number, idx: number) =>
    idx < (lessenPerDag[dag] ?? 0) && !bezet.has(`${dag}-${idx}`);
  const zet = (dag: number, lesIndex: number, id: string) => {
    bezet.add(`${dag}-${lesIndex}`);
    plan.push({ dag, lesIndex, id });
  };
  const slots = (dag: number, moment: EventMoment) =>
    shuffle((moment === "pauze" ? [2, 4] : [1, 3, 5, 6]).filter((i) => vrij(dag, i)));

  // vast: mentoruur op maandag
  zet(0, 1, "mentor");
  // brand op dinsdag of woensdag
  const brandDag = 1 + Math.floor(rnd() * 2);
  const brandSlot = slots(brandDag, "les")[0] ?? 3;
  zet(brandDag, brandSlot, "brand");

  const rest = shuffle(LIVE_EVENTS.filter((e) => e.id !== "mentor" && e.id !== "brand"));
  const perDag = new Map<number, number>([
    [0, 1],
    [brandDag, 1],
  ]);
  for (const ev of rest) {
    // kies de dag met de minste events waar nog een slot vrij is
    const dagen = shuffle([0, 1, 2, 3, 4]).sort(
      (a, b) => (perDag.get(a) ?? 0) - (perDag.get(b) ?? 0),
    );
    for (const dag of dagen) {
      if ((perDag.get(dag) ?? 0) >= 2) continue;
      const slot = slots(dag, ev.moment)[0];
      if (slot === undefined) continue;
      zet(dag, slot, ev.id);
      perDag.set(dag, (perDag.get(dag) ?? 0) + 1);
      break;
    }
  }
  return plan.sort((a, b) => a.dag - b.dag || a.lesIndex - b.lesIndex);
}

/* ---------- Levels ---------- */

export const LEVEL_TITELS = [
  "Nieuwkomer",
  "Gangenloper",
  "Roosterkenner",
  "Planner",
  "Brugklas-pro",
  "Aula-legende",
  "Martinus-meester",
];

export function levelInfo(xp: number) {
  // nodig voor level n (1-based): 50 * n * (n - 1)
  let level = 1;
  while (50 * (level + 1) * level <= xp) level++;
  const huidig = 50 * level * (level - 1);
  const volgende = 50 * (level + 1) * level;
  const titel = LEVEL_TITELS[Math.min(level - 1, LEVEL_TITELS.length - 1)] ?? "Legende";
  return {
    level,
    titel,
    huidig,
    volgende,
    pct: Math.round(((xp - huidig) / (volgende - huidig)) * 100),
  };
}
