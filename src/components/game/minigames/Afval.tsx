import { useCallback, useEffect, useRef, useState } from "react";
import { snd } from "@/lib/game/sound";
import { cn } from "@/lib/utils";
import { Hud, HudPill, TijdBalk, clamp01, shuffle, type GameProps } from "./kit";

/* ========================================================================
 * Afval sorteren: elk stuk afval in de goede bak, zo snel mogelijk.
 * ===================================================================== */

type Bak = "papier" | "pmd" | "gft" | "rest";

const BAKKEN: { id: Bak; naam: string; icon: string; kleur: string; toets: string }[] = [
  {
    id: "papier",
    naam: "Papier",
    icon: "📄",
    kleur: "border-sky-500 bg-sky-500/10 text-sky-700",
    toets: "1",
  },
  {
    id: "pmd",
    naam: "PMD",
    icon: "🧴",
    kleur: "border-orange-500 bg-orange-500/10 text-orange-700",
    toets: "2",
  },
  {
    id: "gft",
    naam: "GFT",
    icon: "🍂",
    kleur: "border-green-600 bg-green-600/10 text-green-700",
    toets: "3",
  },
  {
    id: "rest",
    naam: "Rest",
    icon: "🗑️",
    kleur: "border-zinc-500 bg-zinc-500/10 text-zinc-700",
    toets: "4",
  },
];

const AFVAL: { e: string; naam: string; bak: Bak; waarom: string }[] = [
  { e: "📰", naam: "Krant", bak: "papier", waarom: "Schoon papier mag bij het oud papier." },
  {
    e: "📦",
    naam: "Kartonnen doos",
    bak: "papier",
    waarom: "Karton hoort bij papier (even plat maken).",
  },
  { e: "📓", naam: "Oud schrift", bak: "papier", waarom: "Schriften zijn gewoon papier." },
  { e: "🗞️", naam: "Folder", bak: "papier", waarom: "Folders zijn papier." },
  { e: "🧃", naam: "Leeg drinkpakje", bak: "pmd", waarom: "Drankkartons horen bij PMD." },
  { e: "🧴", naam: "Shampoofles", bak: "pmd", waarom: "Plastic verpakking = PMD." },
  { e: "🥫", naam: "Leeg blikje", bak: "pmd", waarom: "Blik (metaal) hoort bij PMD." },
  { e: "🛍️", naam: "Plastic broodzakje", bak: "pmd", waarom: "Plastic zakjes zijn PMD." },
  { e: "🍶", naam: "Yoghurtbeker", bak: "pmd", waarom: "Plastic beker = PMD (even leegschrapen)." },
  { e: "🍌", naam: "Bananenschil", bak: "gft", waarom: "Groente- en fruitresten = GFT." },
  { e: "🍎", naam: "Klokhuis", bak: "gft", waarom: "Fruitresten horen bij GFT." },
  { e: "🍂", naam: "Bladeren", bak: "gft", waarom: "Tuinafval = GFT." },
  { e: "🥚", naam: "Eierschalen", bak: "gft", waarom: "Eierschalen mogen bij GFT." },
  {
    e: "🧻",
    naam: "Vies servetje",
    bak: "rest",
    waarom: "Vies of vet papier kan niet gerecycled worden.",
  },
  {
    e: "🍕",
    naam: "Vette pizzadoos",
    bak: "rest",
    waarom: "Door het vet mag dit niet bij het papier.",
  },
  { e: "🖊️", naam: "Lege pen", bak: "rest", waarom: "Pennen zijn gemengd materiaal: restafval." },
  { e: "🩹", naam: "Pleister", bak: "rest", waarom: "Pleisters horen bij het restafval." },
  { e: "😷", naam: "Mondkapje", bak: "rest", waarom: "Mondkapjes zijn restafval." },
];

const AANTAL = 14;

export function Afval({ onKlaar }: GameProps) {
  const lijst = useRef(shuffle(AFVAL).slice(0, AANTAL)).current;
  const [i, setI] = useState(0);
  const [punten, setPunten] = useState(0);
  const [goedTotaal, setGoedTotaal] = useState(0);
  const [combo, setCombo] = useState(0);
  const [tijd, setTijd] = useState(1);
  const [feedback, setFeedback] = useState<{ goed: boolean; tekst: string; bak: Bak } | null>(null);
  const klaar = useRef(false);
  const start = useRef(performance.now());

  const limiet = 3.4 - (i / AANTAL) * 1.4; // seconden per item

  const volgende = useCallback(() => {
    setFeedback(null);
    if (i + 1 >= AANTAL) {
      if (klaar.current) return;
      klaar.current = true;
      snd.gong();
      onKlaar({
        score: clamp01(punten / (AANTAL * 16)),
        punten,
        tekst: `${goedTotaal} van de ${AANTAL} stuks afval in de goede bak.`,
      });
      return;
    }
    setI((x) => x + 1);
    setTijd(1);
    start.current = performance.now();
  }, [i, punten, goedTotaal, onKlaar]);

  const kies = useCallback(
    (bak: Bak | null) => {
      if (feedback) return;
      const item = lijst[i]!;
      const goed = bak === item.bak;
      if (goed) {
        const snelheid = 1 - (performance.now() - start.current) / 1000 / limiet;
        const p = 10 + Math.round(Math.max(0, snelheid) * 6) + Math.min(combo, 5);
        setPunten((x) => x + p);
        setGoedTotaal((x) => x + 1);
        setCombo((x) => x + 1);
        snd.combo(combo + 1);
      } else {
        setCombo(0);
        snd.fout();
      }
      setFeedback({
        goed,
        tekst: bak === null ? `Te laat! ${item.waarom}` : item.waarom,
        bak: item.bak,
      });
    },
    [feedback, lijst, i, limiet, combo],
  );

  // timer
  useEffect(() => {
    if (feedback) return;
    const id = window.setInterval(() => {
      const rest = 1 - (performance.now() - start.current) / 1000 / limiet;
      setTijd(rest);
      if (rest <= 0) kies(null);
    }, 50);
    return () => window.clearInterval(id);
  }, [feedback, limiet, kies]);

  // na feedback automatisch door
  useEffect(() => {
    if (!feedback) return;
    const id = window.setTimeout(volgende, feedback.goed ? 550 : 1500);
    return () => window.clearTimeout(id);
  }, [feedback, volgende]);

  // toetsen 1-4
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const b = BAKKEN.find((x) => x.toets === e.key);
      if (b) kies(b.id);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [kies]);

  const item = lijst[i]!;

  return (
    <div>
      <Hud>
        <HudPill tone="muted">
          🗑️ {i + 1}/{AANTAL}
        </HudPill>
        <HudPill tone="brand">⭐ {punten}</HudPill>
        {combo >= 3 ? <HudPill tone="good">🔥 combo ×{combo}</HudPill> : null}
      </Hud>
      <TijdBalk fractie={feedback ? 0 : tijd} />
      <div
        className={cn(
          "relative flex h-44 flex-col items-center justify-center rounded-3xl border-2 transition-colors",
          feedback
            ? feedback.goed
              ? "border-mint bg-mint/10"
              : "border-rose bg-rose/10"
            : "border-border bg-secondary/60",
        )}
      >
        <span key={i} className="animate-pop-in text-6xl">
          {item.e}
        </span>
        <span className="mt-2 text-lg font-bold">{item.naam}</span>
        {feedback ? (
          <span
            className={cn(
              "mt-1 px-4 text-center text-sm font-semibold",
              feedback.goed ? "text-mint" : "text-rose",
            )}
          >
            {feedback.goed ? "✅ " : "❌ "}
            {feedback.tekst}
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {BAKKEN.map((b) => (
          <button
            key={b.id}
            onClick={() => kies(b.id)}
            disabled={!!feedback}
            className={cn(
              "flex flex-col items-center rounded-2xl border-2 px-2 py-3 text-sm font-bold transition-all active:scale-95",
              b.kleur,
              feedback && feedback.bak === b.id ? "ring-4 ring-mint" : "",
            )}
          >
            <span className="text-3xl">{b.icon}</span>
            {b.naam}
            <span className="mt-0.5 hidden text-[10px] opacity-60 sm:block">toets {b.toets}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
