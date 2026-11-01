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

export type Question = { vraag: string; tekst?: string; uitleg?: string } & (
  | { opties: string[]; juist: number; open?: undefined }
  | { open: true; antwoorden: string[]; hint?: string }
);

export type MiniGameDef = { titel: string; uitleg: string } & (
  | { type: "koppel"; paren: [string, string][] }
  | { type: "snel"; sommen: [string, string][]; seconden: number }
  | { type: "volgorde"; items: string[] }
);

export const MINIGAMES: Record<string, MiniGameDef> = {
  "wi-opdr": {
    type: "snel",
    titel: "Rekenrace",
    uitleg: "Warm je brein op! Hoeveel sommen los jij op binnen 45 seconden?",
    seconden: 45,
    sommen: [
      ["7 × 8", "56"], ["12 × 3", "36"], ["81 : 9", "9"], ["−4 + 10", "6"], ["15 − 22", "-7"],
      ["6 × 7", "42"], ["144 : 12", "12"], ["25% van 80", "20"], ["3² ", "9"], ["−3 × 5", "-15"],
      ["100 − 37", "63"], ["9 × 9", "81"],
    ],
  },
  "en-woorden": {
    type: "koppel",
    titel: "Word Match",
    uitleg: "Koppel elk Engels woord aan de Nederlandse vertaling.",
    paren: [
      ["teacher", "docent"], ["classroom", "lokaal"], ["break", "pauze"],
      ["pencil case", "etui"], ["to forget", "vergeten"], ["test", "toets"],
    ],
  },
  "nl-h3": {
    type: "koppel",
    titel: "Zinsdelen-match",
    uitleg: "Koppel elk begrip aan de goede uitleg.",
    paren: [
      ["persoonsvorm", "verandert bij tijd/getal"], ["onderwerp", "wie of wat + pv"],
      ["signaalwoord", "toont verband"], ["hoofdgedachte", "belangrijkste zin"],
      ["'t kofschip", "regel voor -te/-de"],
    ],
  },
  "gs-presentatie": {
    type: "volgorde",
    titel: "Tijdlijn-uitdaging",
    uitleg: "Klik de gebeurtenissen aan van oud naar nieuw.",
    items: [
      "Romeinen in Nederland",
      "Monniken verspreiden het christendom",
      "Leenstelsel en ridders",
      "Handel en steden groeien",
      "Grootebroek krijgt stadsrechten (1364)",
    ],
  },
};

export const EXERCISES: Record<string, { intro?: string; vragen: Question[] }> = {
  "wi-opdr": {
    intro:
      "Wiskunde brugklas — hoofdstuk Getallen & Verbanden. Typ je antwoord zelf in (geen rekenmachine!). Kommagetallen mag je met een komma of punt schrijven.",
    vragen: [
      { vraag: "Bereken: 3 + 4 × 5 − 2", open: true, antwoorden: ["21"], hint: "Eerst vermenigvuldigen, dan optellen en aftrekken.", uitleg: "4 × 5 = 20, dus 3 + 20 − 2 = 21." },
      { vraag: "Bereken: (−6) + 14 − (−3)", open: true, antwoorden: ["11"], hint: "Min een negatief getal is hetzelfde als plus.", uitleg: "−6 + 14 = 8, en 8 + 3 = 11." },
      { vraag: "Vereenvoudig de breuk 18/24.", open: true, antwoorden: ["3/4"], hint: "Deel teller en noemer door hetzelfde getal.", uitleg: "Deel beide door 6: 18/24 = 3/4." },
      { vraag: "Bereken: 1/2 + 1/3 (schrijf als breuk)", open: true, antwoorden: ["5/6"], hint: "Maak de noemers gelijk.", uitleg: "3/6 + 2/6 = 5/6." },
      { vraag: "Een jas kost €60. Je krijgt 15% korting. Hoeveel euro betaal je?", open: true, antwoorden: ["51", "51,00", "€51", "51 euro"], uitleg: "15% van 60 = 9. 60 − 9 = €51." },
      { vraag: "Los op: 3x + 7 = 25. x = ?", open: true, antwoorden: ["6", "x=6"], uitleg: "3x = 18, dus x = 6." },
      { vraag: "Een rechthoek is 8 cm lang en 5 cm breed. Wat is de omtrek in cm?", open: true, antwoorden: ["26", "26cm"], uitleg: "2 × 8 + 2 × 5 = 26 cm." },
      { vraag: "Formule: kosten = 4 × aantal + 3. Wat zijn de kosten bij aantal = 7?", open: true, antwoorden: ["31"], uitleg: "4 × 7 + 3 = 31." },
      { vraag: "Bereken: −2 × (5 − 9) + 3²", open: true, antwoorden: ["17"], hint: "Haakjes eerst, dan machten, dan vermenigvuldigen.", uitleg: "5 − 9 = −4, −2 × −4 = 8, 3² = 9, dus 8 + 9 = 17." },
      { vraag: "Bereken: 2/3 × 9/4 (zo eenvoudig mogelijk)", open: true, antwoorden: ["3/2", "1 1/2", "1,5", "1.5"], uitleg: "18/12 = 3/2." },
      { vraag: "Los op: 5x − 4 = 2x + 11. x = ?", open: true, antwoorden: ["5", "x=5"], hint: "Breng alle x naar één kant.", uitleg: "3x = 15, dus x = 5." },
      { vraag: "Een fiets kost €480 en wordt 25% duurder. Nieuwe prijs in euro?", open: true, antwoorden: ["600", "€600", "600 euro"], uitleg: "25% van 480 = 120. 480 + 120 = 600." },
      { vraag: "Een vierkant heeft een oppervlakte van 49 cm². Hoe groot is de omtrek in cm?", open: true, antwoorden: ["28", "28cm"], uitleg: "Zijde = √49 = 7, omtrek = 4 × 7 = 28." },
      { vraag: "Rond 3,4567 af op twee decimalen.", open: true, antwoorden: ["3,46", "3.46"], uitleg: "Derde decimaal is 6 → naar boven." },
      { vraag: "Je fietst 18 km in 45 minuten. Hoeveel km/u is dat?", open: true, antwoorden: ["24", "24km/u", "24 km/u"], uitleg: "45 min = 0,75 uur. 18 : 0,75 = 24 km/u." },
    ],
  },
  "en-woorden": {
    intro:
      "Engels unit 1 — School life. Vertaal de woorden en vul de zinnen aan. Let op je spelling!",
    vragen: [
      { vraag: "Vertaal naar het Engels: huiswerk", open: true, antwoorden: ["homework"] },
      { vraag: "Vertaal naar het Engels: rooster", open: true, antwoorden: ["timetable", "schedule"] },
      { vraag: "Vertaal naar het Engels: vriendelijk", open: true, antwoorden: ["friendly", "kind"] },
      { vraag: "Vertaal naar het Nederlands: to borrow", open: true, antwoorden: ["lenen", "te lenen"] },
      { vraag: "Vul in met am / is / are: My friends ___ in class 1B.", open: true, antwoorden: ["are"], uitleg: "Meervoud (my friends) → are." },
      { vraag: "Vul in met de juiste vorm van 'to have': She ___ a new bike.", open: true, antwoorden: ["has"], uitleg: "He/she/it → has." },
      { vraag: "Present simple: He ___ (play) football every Saturday.", open: true, antwoorden: ["plays"], uitleg: "He/she/it krijgt een -s." },
      {
        vraag: "Welke zin is goed?",
        opties: ["She don't like maths.", "She doesn't like maths.", "She not likes maths."],
        juist: 1,
        uitleg: "Ontkenning bij he/she/it: doesn't + hele werkwoord.",
      },
      { vraag: "Maak meervoud: one child, two ___", open: true, antwoorden: ["children"], uitleg: "Onregelmatig meervoud." },
      { vraag: "Vertaal naar het Engels: Ik ben twaalf jaar oud.", open: true, antwoorden: ["i am twelve years old", "i'm twelve years old", "i am 12 years old", "i'm 12 years old", "i am twelve", "i'm twelve"] },
      { vraag: "Past simple: Yesterday we ___ (go) to the beach.", open: true, antwoorden: ["went"], uitleg: "Go is onregelmatig: go – went – gone." },
      { vraag: "Maak een vraag: ___ you like pizza? (do/does)", open: true, antwoorden: ["do"], uitleg: "You → do." },
      { vraag: "Present continuous: Look! The dog ___ (run) in the garden.", open: true, antwoorden: ["is running"], uitleg: "Is + ww-ing, en bij run verdubbel je de n." },
      {
        vraag: "Welke zin is goed?",
        opties: ["There is three books on the table.", "There are three books on the table.", "There be three books on the table."],
        juist: 1,
        uitleg: "Meervoud → there are.",
      },
      { vraag: "Vertaal naar het Engels: Mag ik naar de wc?", open: true, antwoorden: ["may i go to the toilet", "can i go to the toilet", "may i go to the bathroom", "can i go to the bathroom", "may i go to the toilet?", "can i go to the toilet?"] },
      { vraag: "Vertaal naar het Engels: Mijn telefoon ligt in mijn kluisje.", open: true, antwoorden: ["my phone is in my locker", "my phone is in my locker."] },
    ],
  },
  "nl-h3": {
    intro:
      "Nederlands hoofdstuk 3 — Lezen & taalverzorging.\n\nTekst: 'De eerste week'\nNoor (12) begon deze maand in de brugklas van het Martinuscollege. De eerste dagen verdwaalde ze twee keer: ze stond in A1.14 terwijl haar les in B1.14 was. 'Ik dacht dat de letter niet uitmaakte,' lacht ze. Inmiddels weet ze dat de letter de vleugel is en het eerste cijfer de verdieping. Toch vindt Noor plannen nog het lastigst. Daarom schrijft ze sinds vorige week elke avond in haar agenda wat ze de volgende dag moet meenemen.",
    vragen: [
      { vraag: "In welk lokaal had Noor les toen ze verdwaalde?", open: true, antwoorden: ["b1.14", "b114"] },
      { vraag: "Wat betekent het eerste cijfer in een lokaalnummer volgens de tekst?", open: true, antwoorden: ["verdieping", "de verdieping"] },
      {
        vraag: "Wat is de hoofdgedachte van de tekst?",
        opties: [
          "Het Martinuscollege is een groot gebouw.",
          "Noor went aan de middelbare school en leert plannen.",
          "Noor vindt de brugklas niet leuk.",
        ],
        juist: 1,
      },
      { vraag: "Zoek in de tekst een signaalwoord dat een tegenstelling aangeeft.", open: true, antwoorden: ["toch", "terwijl"], uitleg: "'Toch' en 'terwijl' geven een tegenstelling aan." },
      { vraag: "Werkwoordspelling: Gisteren ___ (verhuizen) mijn buren.", open: true, antwoorden: ["verhuisden"], uitleg: "Verhuizen → stam verhuis, 's' niet in 't kofschip → -de(n)." },
      { vraag: "Werkwoordspelling: Hij ___ (worden) morgen dertien.", open: true, antwoorden: ["wordt"], uitleg: "Hij → stam + t: wordt." },
      { vraag: "Wat is het onderwerp in de zin: 'Na school fietsen Sem en Lotte naar huis.'", open: true, antwoorden: ["sem en lotte"], uitleg: "Wie fietsen? Sem en Lotte." },
      { vraag: "Wat is de persoonsvorm in: 'Morgen heb ik een toets aardrijkskunde.'", open: true, antwoorden: ["heb"], uitleg: "Maak de zin vragend: heb ik…? → heb." },
      { vraag: "Werkwoordspelling: Ik ___ (antwoorden) de docent gisteren meteen.", open: true, antwoorden: ["antwoordde"], uitleg: "Stam antwoord eindigt op d → +de: antwoordde." },
      { vraag: "Werkwoordspelling: ___ jij morgen ook mee? (gaan)", open: true, antwoorden: ["ga"], uitleg: "Jij achter de pv → geen t: ga jij." },
      { vraag: "Werkwoordspelling: Het pakket werd ___ (bezorgen) bij de buren.", open: true, antwoorden: ["bezorgd"], uitleg: "Voltooid deelwoord, s niet in 't kofschip → -d." },
      {
        vraag: "Welk verband geeft het signaalwoord 'daarom' in de tekst aan?",
        opties: ["Tegenstelling", "Oorzaak/gevolg", "Opsomming", "Tijd"],
        juist: 1,
        uitleg: "Ze vindt plannen lastig → daarom (gevolg) schrijft ze in haar agenda.",
      },
      { vraag: "Wat is het lijdend voorwerp in: 'Noor schrijft haar huiswerk in haar agenda.'", open: true, antwoorden: ["haar huiswerk"], uitleg: "Wat schrijft Noor? Haar huiswerk." },
    ],
  },
  "gs-presentatie": {
    intro:
      "Geschiedenis — Tijdvak 3 & 4: Monniken, ridders en steden (500–1500).\n\nIn de vroege middeleeuwen leefden de meeste mensen als boer op het platteland. Het leenstelsel bepaalde wie de macht had: de koning gaf land in leen aan edelen, en zij gaven een deel door aan ridders. In ruil moesten ze trouw zijn en meevechten. Horigen werkten op het land van de heer en mochten niet zomaar vertrekken. Vanaf ongeveer 1000 groeide de handel. Steden kregen stadsrechten, zoals het recht om een muur te bouwen en markt te houden. Ook in West-Friesland ontstonden steden: Grootebroek kreeg in 1364 stadsrechten.",
    vragen: [
      { vraag: "Hoe heet het systeem waarbij land werd uitgeleend in ruil voor trouw?", open: true, antwoorden: ["leenstelsel", "het leenstelsel"] },
      { vraag: "Hoe noem je boeren die op het land van de heer werkten en niet zomaar weg mochten?", open: true, antwoorden: ["horigen", "horige"] },
      { vraag: "Noem één stadsrecht uit de tekst.", open: true, antwoorden: ["muur", "muur bouwen", "markt", "markt houden", "marktrecht", "een muur bouwen", "markt houden"] },
      { vraag: "In welk jaar kreeg Grootebroek stadsrechten?", open: true, antwoorden: ["1364"] },
      {
        vraag: "Waarom groeiden steden vanaf ongeveer het jaar 1000?",
        opties: ["Door de groei van de handel", "Omdat ridders er gingen wonen", "Omdat boeren geen land meer hadden"],
        juist: 0,
      },
      { vraag: "In welke eeuw valt het jaar 1364?", open: true, antwoorden: ["14", "14e", "14de", "veertiende", "14e eeuw", "veertiende eeuw"], uitleg: "1301–1400 is de 14e eeuw." },
      { vraag: "Welk tijdvak hoort bij 'monniken en ridders' (500–1000)? Typ het nummer.", open: true, antwoorden: ["3", "tijdvak 3"] },
      {
        vraag: "Wat kregen horigen van de heer in ruil voor hun werk?",
        opties: ["Bescherming en een stuk grond", "Een salaris in geld", "Stadsrechten"],
        juist: 0,
      },
      { vraag: "Hoe heet het gebied rond Grootebroek, waar ook het Martinuscollege staat?", open: true, antwoorden: ["west-friesland", "westfriesland", "west friesland"] },
      { vraag: "Hoeveel jaar geleden kreeg Grootebroek stadsrechten (reken vanaf 2026)?", open: true, antwoorden: ["662"], uitleg: "2026 − 1364 = 662." },
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
  {
    id: "s9",
    icon: "📵",
    titel: "Telefoonvrije school",
    vraag: "Het Martinuscollege is telefoonvrij. Je krijgt in de pauze een appje binnen. Wat doe je?",
    opties: [
      { label: "Even stiekem kijken op de wc.", feedback: "Wordt je gesnapt, dan ben je je telefoon kwijt tot het eind van de dag. En je pauze was ook niet echt pauze.", goed: false, effect: { verantwoordelijkheid: -8 } },
      { label: "Telefoon uit laten in mijn kluisje en na school pas kijken.", feedback: "Top! Het appje kan wachten. Je pauze is voor kletsen, eten en even bijkomen.", goed: true, effect: { verantwoordelijkheid: 8, zelfstandigheid: 4 } },
      { label: "Een klasgenoot vragen of ik zijn telefoon even mag lenen.", feedback: "Dan breek je samen de regel. Ook voor hem gaat dat mis.", goed: false, effect: { verantwoordelijkheid: -6, organisatie: -2 } },
    ],
  },
  {
    id: "s10",
    icon: "🪧",
    titel: "Roosterwijziging",
    vraag: "Je loopt naar wiskunde, maar op de roosterpaal in de hal staat iets rood. Wat doe je?",
    opties: [
      { label: "Negeren, ik weet mijn rooster toch al.", feedback: "Juist rode meldingen zijn wijzigingen: ander lokaal of uitval. Nu sta je voor een lege deur.", goed: false, effect: { organisatie: -6, tijdmanagement: -4 } },
      { label: "Bij de roosterpaal checken wat er veranderd is.", feedback: "Goed zo! Omdat er geen telefoons zijn, zijn de roosterpalen je beste vriend. Elke ochtend en elke pauze even kijken.", goed: true, effect: { organisatie: 8, zelfstandigheid: 5 } },
      { label: "Mijn telefoon pakken om het rooster te checken.", feedback: "Telefoon blijft weg op school. Daarvoor staan juist de roosterpalen in de hal.", goed: false, effect: { verantwoordelijkheid: -5 } },
    ],
  },
  {
    id: "s11",
    icon: "🕳️",
    titel: "Tussenuur",
    vraag: "Je les valt uit en je hebt een tussenuur. Wat doe je?",
    opties: [
      { label: "In de aula of mediatheek alvast huiswerk maken.", feedback: "Slim! Dan heb je vanavond meer vrije tijd.", goed: true, effect: { planning: 7, tijdmanagement: 5 } },
      { label: "Rondhangen en wachten tot het voorbij is.", feedback: "Kan, maar zonde van een gratis uur.", goed: false, effect: { tijdmanagement: -3 } },
      { label: "Naar het winkelcentrum lopen en te laat terugkomen.", feedback: "Brugklassers mogen meestal niet zomaar van het terrein. En te laat komen telt mee.", goed: false, effect: { verantwoordelijkheid: -8, tijdmanagement: -5 } },
    ],
  },
  {
    id: "s12",
    icon: "🔐",
    titel: "Kluisje-code vergeten",
    vraag: "Je kluisje gaat niet open en je boeken liggen erin. Wat doe je?",
    opties: [
      { label: "Naar de conciërge gaan.", feedback: "Precies. De conciërge helpt je hier elke dag mee. Schrijf de code daarna in je agenda.", goed: true, effect: { zelfstandigheid: 6, organisatie: 4 } },
      { label: "Er net zo lang aan trekken tot hij opengaat.", feedback: "Dan maak je hem kapot, en dat moet je zelf betalen.", goed: false, effect: { verantwoordelijkheid: -6 } },
      { label: "Zonder boeken naar de les gaan en niets zeggen.", feedback: "Even melden bij de docent is beter. Dan weet hij waarom.", goed: false, effect: { organisatie: -5 } },
    ],
  },
  {
    id: "s13",
    icon: "📉",
    titel: "Een onvoldoende",
    vraag: "Je ziet in Magister een 4,8 voor je eerste toets. Wat doe je?",
    opties: [
      { label: "Kijken welke vragen fout gingen en het vragen aan de docent.", feedback: "Sterk! Van fouten leer je het meest. Volgende keer weet je waar je op moet letten.", goed: true, effect: { leren: 8, zelfstandigheid: 5 } },
      { label: "Het verstoppen voor mijn ouders.", feedback: "Ze zien het toch in Magister. En samen een plan maken helpt juist.", goed: false, effect: { verantwoordelijkheid: -7 } },
      { label: "Denken: ik ben gewoon slecht in dit vak.", feedback: "Eén cijfer zegt weinig. Andere leermethode proberen werkt beter dan opgeven.", goed: false, effect: { leren: -5, zelfstandigheid: -3 } },
    ],
  },
  {
    id: "s14",
    icon: "🚲",
    titel: "Lekke band",
    vraag: "Je band is lek en je bent al laat. Wat doe je?",
    opties: [
      { label: "Een ouder bellen of de school laten weten dat je later komt.", feedback: "Netjes. Als je het meldt, is te laat komen geen probleem.", goed: true, effect: { verantwoordelijkheid: 7, zelfstandigheid: 3 } },
      { label: "Lekker thuisblijven.", feedback: "Zonder melding is dat ongeoorloofd verzuim.", goed: false, effect: { verantwoordelijkheid: -10 } },
      { label: "Lopen en niets melden.", feedback: "Je komt wel, maar je moet je wel melden bij de receptie.", goed: false, effect: { tijdmanagement: -4, organisatie: -2 } },
    ],
  },
  {
    id: "s15",
    icon: "👟",
    titel: "Gymspullen vergeten",
    vraag: "Je hebt vandaag gym, maar je gymtas staat nog thuis. Wat doe je?",
    opties: [
      { label: "Eerlijk melden en vragen wat ik wél kan doen.", feedback: "Goed. Vaak mag je helpen of een vervangende opdracht doen. Zet je gymtas vanavond alvast bij de deur.", goed: true, effect: { verantwoordelijkheid: 6, organisatie: 3 } },
      { label: "Zeggen dat ik ziek ben.", feedback: "Liegen komt meestal uit. En je mist de les toch.", goed: false, effect: { verantwoordelijkheid: -8 } },
      { label: "Op sokken meedoen en niks zeggen.", feedback: "Glad en gevaarlijk. Gewoon even melden is beter.", goed: false, effect: { organisatie: -4 } },
    ],
  },
  {
    id: "s16",
    icon: "😟",
    titel: "Iemand wordt gepest",
    vraag: "In de pauze zie je dat een klasgenoot steeds wordt uitgelachen. Wat doe je?",
    opties: [
      { label: "Het aan de mentor vertellen.", feedback: "Heel goed. Dat is geen klikken, dat is helpen. De mentor kan er echt iets aan doen.", goed: true, effect: { verantwoordelijkheid: 9 } },
      { label: "Meelachen, anders ben ik straks de volgende.", feedback: "Begrijpelijk gevoel, maar zo wordt het erger voor die klasgenoot.", goed: false, effect: { verantwoordelijkheid: -9 } },
      { label: "Bij die klasgenoot gaan zitten.", feedback: "Mooi! Een beetje steun helpt al heel veel. Vertel het ook even aan je mentor.", goed: true, effect: { verantwoordelijkheid: 7, zelfstandigheid: 3 } },
    ],
  },
  {
    id: "s17",
    icon: "🎮",
    titel: "Nieuwe game uit",
    vraag: "Vanavond komt een nieuwe game uit, maar morgen heb je een SO. Wat doe je?",
    opties: [
      { label: "Eerst leren, dan als beloning een uurtje spelen.", feedback: "Perfect! Eerst werk, dan plezier. Zo voelt gamen ook nog beter.", goed: true, effect: { planning: 8, verantwoordelijkheid: 4 } },
      { label: "De hele avond spelen, leren doe ik in de bus.", feedback: "Tien minuten in de bus is echt te weinig voor een SO.", goed: false, effect: { planning: -7, leren: -4 } },
      { label: "Gamen en tegelijk leren.", feedback: "Multitasken werkt niet: je onthoudt bijna niks.", goed: false, effect: { leren: -5 } },
    ],
  },
  {
    id: "s18",
    icon: "🧑‍🏫",
    titel: "Invaldocent",
    vraag: "Er staat een invaldocent voor de klas en de klas wordt onrustig. Wat doe je?",
    opties: [
      { label: "Gewoon aan de opdracht werken.", feedback: "Goed bezig! Zo heb je het werk af en blijf je uit de problemen.", goed: true, effect: { zelfstandigheid: 8 } },
      { label: "Meedoen met de chaos.", feedback: "De invaldocent geeft je naam door, en de opdracht moet alsnog af.", goed: false, effect: { verantwoordelijkheid: -7 } },
      { label: "Vragen of ik met koptelefoon mag werken.", feedback: "Hm, koptelefoon valt ook onder telefoonvrij. Liever gewoon geconcentreerd werken.", goed: false, effect: { zelfstandigheid: 1 } },
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
  { vraag: "Los op: 4x + 6 = 30. x = ?", opties: ["6", "9", "4"], juist: 0 },
  { vraag: "Wat is 3/4 − 1/6?", opties: ["7/12", "2/10", "1/2"], juist: 0 },
  { vraag: "Past simple van 'to buy'?", opties: ["buyed", "bought", "brought"], juist: 1 },
  { vraag: "Welke is goed gespeld?", opties: ["Hij word morgen dertien.", "Hij wordt morgen dertien.", "Hij wort morgen dertien."], juist: 1 },
  { vraag: "In welke eeuw kreeg Grootebroek stadsrechten?", opties: ["13e eeuw", "14e eeuw", "15e eeuw"], juist: 1 },
  { vraag: "Waar check je roosterwijzigingen op het Martinuscollege?", opties: ["Op je telefoon in de les", "Op de roosterpalen in de hal", "Nergens, dat hoeft niet"], juist: 1 },
  { vraag: "Waar blijft je telefoon tijdens schooltijd?", opties: ["In je zak, op stil", "Uit, in je kluisje", "Op tafel, omgedraaid"], juist: 1 },
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
  combo: { naam: "On fire", icon: "⚡", uitleg: "4 lessen achter elkaar op tijd." },
  wijs: { naam: "Wijze keuzes", icon: "🦉", uitleg: "8 goede keuzes bij onverwachte situaties." },
  doorzetter: { naam: "Doorzetter", icon: "🔥", uitleg: "Alle huiswerk van de week afgemaakt." },
};
