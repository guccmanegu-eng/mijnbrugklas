import { useEffect, useRef, useState } from "react";
import { SUBJECTS } from "@/lib/game/data";
import { snd } from "@/lib/game/sound";
import { cn } from "@/lib/utils";
import { Hud, HudPill, clamp01, shuffle, type GameProps } from "./kit";

/* ========================================================================
 * Rooster-memory: vind steeds het vak dat bij het lokaal hoort.
 * ===================================================================== */

type Kaart = { id: number; paar: number; voor: string; sub: string; soort: "vak" | "lokaal" };

function maakKaarten(): Kaart[] {
  const paren = [
    ...Object.values(SUBJECTS).map((v) => ({ vak: `${v.icon}`, naam: v.naam, lokaal: v.lokaal })),
    { vak: "🧑‍🏫", naam: "Mentoruur", lokaal: "A0.02" },
  ];
  const kaarten: Kaart[] = [];
  paren.forEach((p, i) => {
    kaarten.push({ id: i * 2, paar: i, voor: p.vak, sub: p.naam, soort: "vak" });
    kaarten.push({ id: i * 2 + 1, paar: i, voor: p.lokaal, sub: "lokaal", soort: "lokaal" });
  });
  return shuffle(kaarten);
}

export function Memory({ onKlaar }: GameProps) {
  const kaarten = useRef(maakKaarten()).current;
  const [open, setOpen] = useState<number[]>([]);
  const [gevonden, setGevonden] = useState<number[]>([]);
  const [beurten, setBeurten] = useState(0);
  const [fout, setFout] = useState(false);
  const [sec, setSec] = useState(0);
  const klaar = useRef(false);
  const aantalParen = kaarten.length / 2;

  useEffect(() => {
    if (gevonden.length === aantalParen) return;
    const id = window.setInterval(() => setSec((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, [gevonden.length, aantalParen]);

  useEffect(() => {
    if (gevonden.length !== aantalParen || klaar.current) return;
    klaar.current = true;
    snd.juich();
    const score = clamp01(1 - (beurten - aantalParen) / 12) * 0.8 + clamp01(1 - sec / 90) * 0.2;
    window.setTimeout(
      () =>
        onKlaar({
          score,
          punten: Math.max(10, 200 - beurten * 8 - sec),
          tekst: `Alle ${aantalParen} paren gevonden in ${beurten} beurten (${sec} seconden).`,
        }),
      900,
    );
  }, [gevonden.length, aantalParen, beurten, sec, onKlaar]);

  const draai = (k: Kaart) => {
    if (open.length === 2 || open.includes(k.id) || gevonden.includes(k.paar)) return;
    snd.klik();
    const nieuw = [...open, k.id];
    setOpen(nieuw);
    if (nieuw.length === 2) {
      setBeurten((b) => b + 1);
      const [a, b] = nieuw.map((id) => kaarten.find((x) => x.id === id)!);
      if (a!.paar === b!.paar) {
        window.setTimeout(() => {
          snd.ster();
          setGevonden((g) => [...g, a!.paar]);
          setOpen([]);
        }, 350);
      } else {
        setFout(true);
        window.setTimeout(() => {
          setOpen([]);
          setFout(false);
        }, 850);
      }
    }
  };

  return (
    <div>
      <Hud>
        <HudPill tone="muted">🔁 {beurten} beurten</HudPill>
        <HudPill tone="good">
          ✅ {gevonden.length}/{aantalParen}
        </HudPill>
        <HudPill tone="muted">⏱ {sec}s</HudPill>
      </Hud>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4" style={{ perspective: "800px" }}>
        {kaarten.map((k) => {
          const zicht = open.includes(k.id) || gevonden.includes(k.paar);
          const isGevonden = gevonden.includes(k.paar);
          return (
            <button
              key={k.id}
              onClick={() => draai(k)}
              className={cn(
                "flex h-24 flex-col items-center justify-center rounded-2xl border-2 text-center font-bold transition-all active:scale-95",
                !zicht && "border-brand/40 bg-brand text-primary-foreground hover:-translate-y-0.5",
                zicht &&
                  !isGevonden &&
                  (fout && open.length === 2
                    ? "border-rose bg-rose/10 animate-shake"
                    : "border-brand bg-card animate-flip"),
                isGevonden && "border-mint bg-mint/12 text-mint",
              )}
            >
              {zicht ? (
                <span key="voor" className="animate-flip">
                  <span
                    className={cn("block", k.soort === "vak" ? "text-3xl" : "font-mono text-2xl")}
                  >
                    {k.voor}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-semibold opacity-80">{k.sub}</span>
                </span>
              ) : (
                <span className="text-2xl opacity-90">❓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
