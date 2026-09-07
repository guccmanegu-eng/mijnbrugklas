export type SubjectId = "nederlands" | "wiskunde" | "engels" | "biologie" | "geschiedenis";

export type Subject = {
  id: SubjectId;
  naam: string;
  icon: string;
  lokaal: string;
  item: string;
  itemNaam: string;
};

export const SUBJECTS: Record<SubjectId, Subject> = {
  nederlands: {
    id: "nederlands",
    naam: "Nederlands",
    icon: "🇳🇱",
    lokaal: "B1.12",
    item: "nl-boek",
    itemNaam: "Nederlands boek",
  },
  wiskunde: {
    id: "wiskunde",
    naam: "Wiskunde",
    icon: "➗",
    lokaal: "C0.04",
    item: "wi-boek",
    itemNaam: "Wiskundeboek",
  },
  engels: {
    id: "engels",
    naam: "Engels",
    icon: "🇬🇧",
    lokaal: "A2.21",
    item: "en-boek",
    itemNaam: "Engels boek",
  },
  biologie: {
    id: "biologie",
    naam: "Biologie",
    icon: "🧪",
    lokaal: "C1.03",
    item: "bio-boek",
    itemNaam: "Biologieboek",
  },
  geschiedenis: {
    id: "geschiedenis",
    naam: "Geschiedenis",
    icon: "🏛️",
    lokaal: "B0.08",
    item: "hw-boek",
    itemNaam: "Huiswerkboek",
  },
};

export type BackpackItem = { id: string; naam: string; icon: string };

export const BACKPACK_ITEMS: BackpackItem[] = [
  { id: "nl-boek", naam: "Nederlands boek", icon: "📕" },
  { id: "wi-boek", naam: "Wiskundeboek", icon: "📗" },
  { id: "en-boek", naam: "Engels boek", icon: "📘" },
  { id: "bio-boek", naam: "Biologieboek", icon: "🧪" },
  { id: "hw-boek", naam: "Huiswerkboek", icon: "📓" },
  { id: "etui", naam: "Etui", icon: "✏️" },
];

export type Lesson = { tijd: string; minuten: number; subject: SubjectId };

export const DAY_NAMES = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"];
export const DAY_DATES = ["8 september", "9 september", "10 september", "11 september", "12 september"];

const t = (tijd: string, subject: SubjectId): Lesson => {
  const [h = 0, m = 0] = tijd.split(":").map(Number);
  return { tijd, minuten: h * 60 + m, subject };
};

export const SCHEDULE: Lesson[][] = [
  [
    t("08:20", "nederlands"),
    t("09:10", "wiskunde"),
    t("10:20", "engels"),
    t("11:10", "biologie"),
    t("12:30", "geschiedenis"),
    t("13:20", "wiskunde"),
    t("14:10", "nederlands"),
  ],
  [
    t("08:20", "engels"),
    t("09:10", "wiskunde"),
    t("10:20", "biologie"),
    t("11:10", "nederlands"),
    t("12:30", "geschiedenis"),
    t("13:20", "engels"),
    t("14:10", "wiskunde"),
  ],
  [
    t("08:20", "nederlands"),
    t("09:10", "biologie"),
    t("10:20", "engels"),
    t("11:10", "wiskunde"),
    t("12:30", "geschiedenis"),
  ],
  [
    t("08:20", "wiskunde"),
    t("09:10", "nederlands"),
    t("10:20", "engels"),
    t("11:10", "biologie"),
    t("12:30", "geschiedenis"),
    t("13:20", "wiskunde"),
    t("14:10", "engels"),
  ],
  [
    t("08:20", "nederlands"),
    t("09:10", "wiskunde"),
    t("10:20", "engels"),
    t("11:10", "biologie"),
    t("12:30", "geschiedenis"),
  ],
];

export const ALL_ROOMS = {
  A: ["A0.02", "A0.05", "A1.14", "A1.18", "A2.21", "A2.24"],
  B: ["B0.08", "B0.11", "B1.12", "B1.16", "B2.03", "B2.07"],
  C: ["C0.04", "C0.09", "C1.03", "C1.10", "C2.02", "C2.06"],
};

export const ROOM_LIST = [...ALL_ROOMS.A, ...ALL_ROOMS.B, ...ALL_ROOMS.C];

export type HomeworkDef = {
  id: string;
  subject: SubjectId;
  titel: string;
  deadlineDag: number;
  gegevenOpDag: number;
};

export const HOMEWORK: HomeworkDef[] = [
  {
    id: "nl-h3",
    subject: "nederlands",
    titel: "Lees hoofdstuk 3",
    deadlineDag: 1,
    gegevenOpDag: 0,
  },
  {
    id: "wi-opdr",
    subject: "wiskunde",
    titel: "Maak opdrachten 1–20",
    deadlineDag: 2,
    gegevenOpDag: 0,
  },
  {
    id: "en-woorden",
    subject: "engels",
    titel: "Leer 30 woorden",
    deadlineDag: 3,
    gegevenOpDag: 0,
  },
  {
    id: "gs-presentatie",
    subject: "geschiedenis",
    titel: "Maak een presentatie",
    deadlineDag: 4,
    gegevenOpDag: 1,
  },
];

/* ---------- Opdrachten (huiswerk maken) ---------- */

export type Question = { vraag: string; opties: string[]; juist: number; tekst?: string };

export const EXERCISES: Record<string, { intro?: string; vragen: Question[] }> = {
  "wi-opdr": {
    intro: "Vijf korte rekensommen. Neem je tijd en reken het rustig uit.",
    vragen: [
      { vraag: "7 × 8 = ?", opties: ["54", "56", "58"], juist: 1 },
      { vraag: "144 : 12 = ?", opties: ["11", "12", "14"], juist: 1 },
      { vraag: "Hoeveel is 25% van 80?", opties: ["16", "20", "25"], juist: 1 },
      { vraag: "3² + 4² = ?", opties: ["25", "24", "49"], juist: 0 },
      { vraag: "Los op: 5x = 45. Wat is x?", opties: ["8", "9", "10"], juist: 1 },
    ],
  },
  "en-woorden": {
    intro: "Tien woordjes Engels. Kies de juiste vertaling.",
    vragen: [
      { vraag: "school", opties: ["school", "boek", "les"], juist: 0 },
      { vraag: "homework", opties: ["huiswerk", "huisdier", "hulp"], juist: 0 },
      { vraag: "teacher", opties: ["leerling", "docent", "directeur"], juist: 1 },
      { vraag: "timetable", opties: ["tijdschrift", "rooster", "tafel"], juist: 1 },
      { vraag: "break", opties: ["pauze", "brood", "breuk"], juist: 0 },
      { vraag: "classroom", opties: ["klasgenoot", "lokaal", "kluisje"], juist: 1 },
      { vraag: "test", opties: ["toets", "taak", "tekst"], juist: 0 },
      { vraag: "backpack", opties: ["rugzak", "pakket", "achterkant"], juist: 0 },
      { vraag: "to remember", opties: ["vergeten", "onthouden", "herhalen"], juist: 1 },
      { vraag: "on time", opties: ["op tijd", "een keer", "in de tijd"], juist: 0 },
    ],
  },
  "nl-h3": {
    intro:
      "Lees de tekst en beantwoord de drie vragen.\n\nOp de middelbare school heb je elke dag andere lessen en andere lokalen. In je agenda schrijf je op wanneer je huiswerk af moet zijn. Wie zijn agenda goed bijhoudt, hoeft nooit te haasten. Vergeet je een opdracht, dan is het slim om dit zelf bij je docent te melden.",
    vragen: [
      {
        vraag: "Waarom is een agenda handig op de middelbare school?",
        opties: [
          "Omdat je dan weet wanneer huiswerk af moet zijn",
          "Omdat het mooi staat in je rugzak",
          "Omdat de docent dat mooi vindt",
        ],
        juist: 0,
      },
      {
        vraag: "Wat verandert er ten opzichte van de basisschool?",
        opties: ["Je hebt één juf of meester", "Je hebt elke dag andere lessen en lokalen", "Je hebt geen huiswerk"],
        juist: 1,
      },
      {
        vraag: "Wat doe je volgens de tekst als je een opdracht vergeet?",
        opties: ["Niets zeggen", "Het zelf melden bij je docent", "Het van iemand overschrijven"],
        juist: 1,
      },
    ],
  },
  "gs-presentatie": {
    intro:
      "Lees de tekst en beantwoord de drie vragen.\n\nIn de middeleeuwen woonden veel mensen op het platteland en werkten ze voor een heer. Ridders beschermden het gebied en kregen daarvoor land. Steden groeiden later door handel en ambachten. Wie in een stad woonde, was vaak vrijer dan een boer op het land.",
    vragen: [
      {
        vraag: "Wat kregen ridders voor hun bescherming?",
        opties: ["Goud", "Land", "Een kasteel in de stad"],
        juist: 1,
      },
      { vraag: "Waardoor groeiden steden?", opties: ["Door handel en ambachten", "Door oorlog", "Door scholen"], juist: 0 },
      {
        vraag: "Wie was vaak vrijer?",
        opties: ["Een boer op het land", "Iemand die in de stad woonde", "Een ridder"],
        juist: 1,
      },
    ],
  },
};

/* ---------- Onverwachte situaties ---------- */

export type SkillId =
  | "planning"
  | "tijdmanagement"
  | "organisatie"
  | "leren"
  | "zelfstandigheid"
  | "verantwoordelijkheid";

export const SKILL_META: Record<SkillId, { naam: string; icon: string; kleur: string }> = {
  planning: { naam: "Planning", icon: "📅", kleur: "bg-brand" },
  tijdmanagement: { naam: "Tijdmanagement", icon: "⏰", kleur: "bg-rose" },
  organisatie: { naam: "Organisatie", icon: "🎒", kleur: "bg-mint" },
  leren: { naam: "Leren", icon: "🧠", kleur: "bg-amber" },
  zelfstandigheid: { naam: "Zelfstandigheid", icon: "💪", kleur: "bg-brand-deep" },
  verantwoordelijkheid: { naam: "Verantwoordelijkheid", icon: "🤝", kleur: "bg-mint" },
};

export type Situation = {
  id: string;
  icon: string;
  titel: string;
  vraag: string;
  opties: {
    label: string;
    feedback: string;
    goed: boolean;
    effect: Partial<Record<SkillId, number>>;
  }[];
};

export const SITUATIONS: Situation[] = [
  {
    id: "s1",
    icon: "😰",
    titel: "Je hebt je huiswerk niet af",
    vraag: "De docent vraagt om je huiswerk. Wat doe je?",
    opties: [
      {
        label: "Ik doe alsof ik het vergeten ben.",
        feedback: "Een uitvlucht helpt je niet. De docent merkt het toch en jij loopt achter.",
        goed: false,
        effect: { verantwoordelijkheid: -8, zelfstandigheid: -3 },
      },
      {
        label: "Ik vertel de docent eerlijk wat er is gebeurd.",
        feedback: "Goed! Eerlijk zijn levert bijna altijd hulp op en je kunt een nieuwe afspraak maken.",
        goed: true,
        effect: { verantwoordelijkheid: 8, zelfstandigheid: 4 },
      },
      {
        label: "Ik kopieer snel van iemand.",
        feedback: "Overschrijven levert niets op: jij leert het niet en het kan als fraude gelden.",
        goed: false,
        effect: { verantwoordelijkheid: -10, leren: -5 },
      },
    ],
  },
  {
    id: "s2",
    icon: "🕐",
    titel: "Nog 4 minuten",
    vraag: "Je volgende lokaal is aan de andere kant van de school. Wat doe je?",
    opties: [
      {
        label: "Rustig blijven en de snelste route zoeken.",
        feedback: "Precies. Even je rooster checken en doorlopen: dan haal je het bijna altijd.",
        goed: true,
        effect: { tijdmanagement: 8, planning: 3 },
      },
      {
        label: "Naar een verkeerd lokaal gaan omdat het dichterbij is.",
        feedback: "Dan ben je alsnog te laat én in de verkeerde les.",
        goed: false,
        effect: { tijdmanagement: -7, organisatie: -3 },
      },
      {
        label: "Te laat komen en dat maar accepteren.",
        feedback: "Te laat komen kost lestijd en telt mee op je rapport.",
        goed: false,
        effect: { tijdmanagement: -9 },
      },
    ],
  },
  {
    id: "s3",
    icon: "📚",
    titel: "Toets én huiswerk",
    vraag: "Morgen heb je een toets, maar je hebt ook nog huiswerk. Wat doe je?",
    opties: [
      {
        label: "Alles bewaren tot vanavond laat.",
        feedback: "Uitstellen maakt de stapel groter en je wordt er moe van.",
        goed: false,
        effect: { planning: -8, leren: -4 },
      },
      {
        label: "Eerst een planning maken.",
        feedback: "Sterk! Als je opschrijft wat wanneer moet, valt het meestal mee.",
        goed: true,
        effect: { planning: 9, leren: 4 },
      },
      {
        label: "Alleen het huiswerk doen en niet leren.",
        feedback: "Je huiswerk is dan af, maar je toets gaat je verrassen.",
        goed: false,
        effect: { leren: -8 },
      },
    ],
  },
  {
    id: "s4",
    icon: "🤔",
    titel: "Je begrijpt de uitleg niet",
    vraag: "De docent legt iets uit en je snapt het niet. Wat doe je?",
    opties: [
      {
        label: "Niets doen en hopen dat je het later begrijpt.",
        feedback: "Je vraag blijft dan staan en bij de toets wordt het lastig.",
        goed: false,
        effect: { zelfstandigheid: -6, leren: -4 },
      },
      {
        label: "Je hand opsteken en om uitleg vragen.",
        feedback: "Top. Vragen stellen is geen zwakte, het is de snelste manier om iets te leren.",
        goed: true,
        effect: { zelfstandigheid: 8, leren: 6 },
      },
      {
        label: "Een klasgenoot vragen het uit te leggen.",
        feedback: "Ook slim! Samen leren werkt goed — check daarna wel of het echt klopt.",
        goed: true,
        effect: { zelfstandigheid: 5, leren: 3 },
      },
    ],
  },
  {
    id: "s5",
    icon: "🎒",
    titel: "Verkeerde boeken mee",
    vraag: "Je hebt de boeken van gisteren in je rugzak. Wat doe je?",
    opties: [
      {
        label: "Vanaf nu 's ochtends mijn rooster checken.",
        feedback: "Dat is de gewoonte die alles makkelijker maakt.",
        goed: true,
        effect: { organisatie: 9, planning: 3 },
      },
      {
        label: "Steeds alle boeken meenemen.",
        feedback: "Werkt wel, maar je rugzak wordt loodzwaar en je verliest overzicht.",
        goed: false,
        effect: { organisatie: 1 },
      },
      {
        label: "Elke les een boek lenen van iemand.",
        feedback: "Dat gaat een keer goed, daarna niet meer.",
        goed: false,
        effect: { organisatie: -7, verantwoordelijkheid: -4 },
      },
    ],
  },
  {
    id: "s6",
    icon: "💬",
    titel: "Groepsopdracht",
    vraag: "Je groepje doet niets aan de opdracht. Wat doe je?",
    opties: [
      {
        label: "Alles zelf maken en niets zeggen.",
        feedback: "Je redt de opdracht, maar het is niet eerlijk en je leert niet samenwerken.",
        goed: false,
        effect: { zelfstandigheid: 3, verantwoordelijkheid: -3 },
      },
      {
        label: "Taken verdelen en een deadline afspreken.",
        feedback: "Precies zoals het werkt: verdelen en afspreken wanneer het klaar is.",
        goed: true,
        effect: { planning: 7, verantwoordelijkheid: 6 },
      },
      {
        label: "Niets doen, want zij doen ook niets.",
        feedback: "Dan levert niemand iets in en jij krijgt ook een lage beoordeling.",
        goed: false,
        effect: { verantwoordelijkheid: -9 },
      },
    ],
  },
  {
    id: "s7",
    icon: "😴",
    titel: "Laat opgebleven",
    vraag: "Je hebt tot laat gegamed en bent moe. Wat doe je?",
    opties: [
      {
        label: "In de les bijslapen.",
        feedback: "Je mist de uitleg en moet het thuis alsnog leren.",
        goed: false,
        effect: { leren: -7, verantwoordelijkheid: -4 },
      },
      {
        label: "Vandaag eerder stoppen met gamen en op tijd naar bed.",
        feedback: "Slim. Uitgerust naar school is het halve werk.",
        goed: true,
        effect: { verantwoordelijkheid: 7, leren: 4 },
      },
      {
        label: "Extra energiedrank nemen.",
        feedback: "Kort een boost, daarna nog vermoeider. Geen oplossing.",
        goed: false,
        effect: { verantwoordelijkheid: -5 },
      },
    ],
  },
  {
    id: "s8",
    icon: "🗺️",
    titel: "Je bent verdwaald",
    vraag: "Je vindt lokaal C1.03 niet. Wat doe je?",
    opties: [
      {
        label: "Rondlopen tot ik het vind.",
        feedback: "Kost veel tijd. De plattegrond of iemand vragen is sneller.",
        goed: false,
        effect: { tijdmanagement: -5 },
      },
      {
        label: "De plattegrond bekijken en de letter van het gebouw volgen.",
        feedback: "Goed! Op het Martinuscollege zegt de code alles: C1.03 is vleugel C, eerste verdieping, lokaal 03.",
        goed: true,
        effect: { zelfstandigheid: 7, tijdmanagement: 5 },
      },
      {
        label: "Naar huis gaan.",
        feedback: "Dat is spijbelen — en het probleem is morgen nog steeds hetzelfde.",
        goed: false,
        effect: { verantwoordelijkheid: -10, tijdmanagement: -5 },
      },
    ],
  },
];

/* ---------- Toets ---------- */

export const TEST_QUESTIONS: Question[] = [
  { vraag: "7 × 9 = ?", opties: ["63", "56", "72"], juist: 0 },
  { vraag: "Hoeveel is 30% van 60?", opties: ["18", "20", "24"], juist: 0 },
  { vraag: "Vertaal: 'timetable'", opties: ["rooster", "tafel", "tijdschrift"], juist: 0 },
  { vraag: "Vertaal: 'to remember'", opties: ["vergeten", "onthouden", "herinneren aan"], juist: 1 },
  {
    vraag: "Wat schrijf je in je agenda?",
    opties: ["Wanneer huiswerk af moet zijn", "Je lievelingsvak", "Je pauzes"],
    juist: 0,
  },
  { vraag: "Waar kreeg een ridder land voor?", opties: ["Handel", "Bescherming", "Belasting"], juist: 1 },
  { vraag: "Waardoor groeiden steden in de middeleeuwen?", opties: ["Handel en ambachten", "Oorlog", "Kerken"], juist: 0 },
  { vraag: "Op welke verdieping zit lokaal C1.03?", opties: ["Begane grond", "Eerste verdieping", "Tweede verdieping"], juist: 1 },
  { vraag: "Wat doe je als je de uitleg niet snapt?", opties: ["Vragen stellen", "Wachten", "Overschrijven"], juist: 0 },
  {
    vraag: "Je hebt drie opdrachten deze week. Wat doe je eerst?",
    opties: ["De laatste dag alles doen", "Ze verdelen over de week", "Alleen de makkelijkste"],
    juist: 1,
  },
];

export const BADGES: Record<string, { naam: string; icon: string; uitleg: string }> = {
  optijd: { naam: "Altijd op tijd", icon: "⏰", uitleg: "5 lessen op tijd bereikt." },
  voorbereid: { naam: "Goed voorbereid", icon: "🎒", uitleg: "Nooit een benodigd schoolitem vergeten." },
  planner: { naam: "Planner", icon: "📅", uitleg: "Alle huiswerkopdrachten op tijd gepland." },
  slim: { naam: "Slim geleerd", icon: "🧠", uitleg: "Goede voorbereiding voor de toets." },
  doorzetter: { naam: "Doorzetter", icon: "🔥", uitleg: "Alle huiswerk van de week afgemaakt." },
};
