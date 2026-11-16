import { useEffect, useRef, useState } from "react";
import { snd } from "@/lib/game/sound";
import { cn } from "@/lib/utils";
import { Hud, HudPill, clamp01, shuffle, type GameProps } from "./kit";

/* ========================================================================
 * Kluiskraker: raad de code van 3 verschillende cijfers met hints.
 * 🟢 = goed cijfer op goede plek, 🟡 = goed cijfer op verkeerde plek.
 * ===================================================================== */

const LENGTE = 3;
const MAX = 7;

type Poging = { code: number[]; groen: number; geel: number };

export function Kluiskraker({ onKlaar }: GameProps) {
  const geheim = useRef(shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, LENGTE)).current;
  const [invoer, setInvoer] = useState<number[]>([]);
  const [pogingen, setPogingen] = useState<Poging[]>([]);
  const [schud, setSchud] = useState(false);
  const [open, setOpen] = useState<null | boolean>(null);
  const [notities, setNotities] = useState<Record<number, "weg" | "ja" | undefined>>({});

  const druk = (n: number) => {
    if (open !== null || invoer.length >= LENGTE || invoer.includes(n)) return;
    snd.klik();
    setInvoer([...invoer, n]);
  };
  const wis = () => setInvoer(invoer.slice(0, -1));

  const probeer = () => {
    if (invoer.length !== LENGTE || open !== null) return;
    const groen = invoer.filter((d, i) => geheim[i] === d).length;
    const geel = invoer.filter((d, i) => geheim[i] !== d && geheim.includes(d)).length;
    const nieuw = [...pogingen, { code: invoer, groen, geel }];
    setPogingen(nieuw);
    setInvoer([]);
    if (groen === LENGTE) {
      snd.level();
      setOpen(true);
      const punten = (MAX + 1 - nieuw.length) * 15;
      window.setTimeout(
        () =>
          onKlaar({
            score: clamp01(0.35 + ((MAX - nieuw.length) / (MAX - 1)) * 0.65),
            punten,
            tekst: `Kluis open in ${nieuw.length} ${nieuw.length === 1 ? "poging" : "pogingen"}! De code was ${geheim.join("")}.`,
          }),
        1300,
      );
    } else if (nieuw.length >= MAX) {
      snd.fout();
      setOpen(false);
      window.setTimeout(
        () =>
          onKlaar({
            score: 0.1,
            punten: 5,
            tekst: `Niet gelukt. De code was ${geheim.join("")}. De conciërge opent hem met de loper.`,
          }),
        1600,
      );
    } else {
      snd.fout();
      setSchud(true);
      window.setTimeout(() => setSchud(false), 400);
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) druk(Number(e.key));
      else if (e.key === "Backspace") wis();
      else if (e.key === "Enter") probeer();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const wisselNotitie = (n: number) =>
    setNotities((x) => ({
      ...x,
      [n]: x[n] === undefined ? "weg" : x[n] === "weg" ? "ja" : undefined,
    }));

  return (
    <div>
      <Hud>
        <HudPill tone={MAX - pogingen.length <= 2 ? "bad" : "muted"}>
          🔑 Nog {MAX - pogingen.length} pogingen
        </HudPill>
        <HudPill tone="good">🟢 goede plek</HudPill>
        <HudPill tone="warn">🟡 zit erin, andere plek</HudPill>
      </Hud>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          {/* kluisdeur */}
          <div
            className={cn(
              "relative mx-auto flex max-w-xs flex-col items-center rounded-3xl border-4 p-5 transition-all",
              open === true
                ? "border-mint bg-mint/10"
                : open === false
                  ? "border-rose bg-rose/10"
                  : "border-ink/70 bg-secondary",
            )}
            style={schud ? { animation: "shake 0.4s" } : undefined}
          >
            <p className="text-4xl">{open === true ? "🔓" : "🔐"}</p>
            <div className="mt-3 flex gap-2">
              {Array.from({ length: LENGTE }, (_, i) => (
                <span
                  key={i}
                  className="flex h-14 w-12 items-center justify-center rounded-xl border-2 border-border bg-card font-mono text-3xl font-bold"
                >
                  {open === true ? geheim[i] : (invoer[i] ?? "·")}
                </span>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => druk(n)}
                  disabled={invoer.includes(n) || open !== null}
                  className="h-12 w-14 rounded-xl border-2 border-border bg-card text-lg font-bold active:scale-95 disabled:opacity-40"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={wis}
                className="h-12 w-14 rounded-xl border-2 border-border bg-card text-lg active:scale-95"
              >
                ⌫
              </button>
              <button
                onClick={() => druk(0)}
                disabled={invoer.includes(0) || open !== null}
                className="h-12 w-14 rounded-xl border-2 border-border bg-card text-lg font-bold active:scale-95 disabled:opacity-40"
              >
                0
              </button>
              <button
                onClick={probeer}
                disabled={invoer.length !== LENGTE || open !== null}
                className="h-12 w-14 rounded-xl bg-brand text-lg font-bold text-primary-foreground active:scale-95 disabled:opacity-40"
              >
                ✓
              </button>
            </div>
          </div>
        </div>

        <div className="min-w-[11rem]">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Pogingen
          </p>
          <ul className="space-y-1.5">
            {pogingen.map((p, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-1.5 font-mono text-lg"
              >
                <span className="font-bold">{p.code.join(" ")}</span>
                <span className="text-base">
                  {"🟢".repeat(p.groen)}
                  {"🟡".repeat(p.geel)}
                  {"⚪".repeat(LENGTE - p.groen - p.geel)}
                </span>
              </li>
            ))}
            {pogingen.length === 0 ? (
              <li className="text-sm text-muted-foreground">Nog niets geprobeerd.</li>
            ) : null}
          </ul>
          <p className="mb-1.5 mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Kladblok (tik = wegstrepen)
          </p>
          <div className="flex flex-wrap gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => wisselNotitie(n)}
                className={cn(
                  "h-8 w-8 rounded-lg border text-sm font-bold",
                  notities[n] === "weg"
                    ? "border-border text-muted-foreground line-through opacity-50"
                    : notities[n] === "ja"
                      ? "border-mint bg-mint/15 text-mint"
                      : "border-border bg-card",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
      {open === true ? (
        <p className="mt-3 text-center font-bold text-mint">🎉 Klik! De kluis gaat open.</p>
      ) : null}
      {open === false ? (
        <p className="mt-3 text-center font-bold text-rose">De code was {geheim.join("")}.</p>
      ) : null}
    </div>
  );
}
