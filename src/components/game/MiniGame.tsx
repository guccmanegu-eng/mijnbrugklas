import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MiniGameDef } from "@/lib/game/data";
import { sterren, type MiniResult } from "@/lib/game/events";
import { snd } from "@/lib/game/sound";
import { BigButton, Card, Pill } from "./bits";
import { Hud, HudPill, TijdBalk, clamp01, shuffle } from "./minigames/kit";
import { cn } from "@/lib/utils";

/* ========================================================================
 * Huiswerk-minigames: korte opwarmers vóór de echte opdrachten.
 * Elke game geeft een MiniResult terug (score 0..1) → sterren + bonus-XP.
 * ===================================================================== */

export function MiniGame({
  game,
  onKlaar,
}: {
  game: MiniGameDef;
  onKlaar: (r: MiniResult) => void;
}) {
  const [resultaat, setResultaat] = useState<MiniResult | null>(null);
  const [ronde, setRonde] = useState(0);
  const klaar = useCallback((r: MiniResult) => setResultaat(r), []);

  return (
    <Card className="border-2 border-brand/30">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">🎮 {game.titel}</h2>
        <Pill tone="brand">Minigame</Pill>
      </div>
      {resultaat ? (
        <ResultaatKaart
          r={resultaat}
          onVerder={() => onKlaar(resultaat)}
          onOpnieuw={() => {
            setResultaat(null);
            setRonde((x) => x + 1);
          }}
          verderLabel="Door naar de opdrachten →"
        />
      ) : (
        <div key={ronde}>
          <p className="mb-4 text-sm text-muted-foreground">{game.uitleg}</p>
          {game.type === "koppel" ? (
            <Koppel paren={game.paren} onKlaar={klaar} />
          ) : game.type === "snel" ? (
            <Snel sommen={game.sommen} seconden={game.seconden} onKlaar={klaar} />
          ) : game.type === "sorteer" ? (
            <Sorteer
              bakken={game.bakken}
              items={game.items}
              seconden={game.seconden}
              onKlaar={klaar}
            />
          ) : (
            <Volgorde items={game.items} onKlaar={klaar} />
          )}
        </div>
      )}
    </Card>
  );
}

export function Sterren({ score, groot }: { score: number; groot?: boolean }) {
  const n = sterren(score);
  return (
    <div className={cn("flex justify-center gap-1", groot ? "text-5xl" : "text-2xl")}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn("animate-pop-in", i < n ? "" : "opacity-20 grayscale")}
          style={{ animationDelay: `${i * 150}ms` }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

export function ResultaatKaart({
  r,
  onVerder,
  onOpnieuw,
  verderLabel = "Verder →",
  extra,
}: {
  r: MiniResult;
  onVerder?: () => void;
  onOpnieuw?: () => void;
  verderLabel?: string;
  extra?: React.ReactNode;
}) {
  const n = sterren(r.score);
  useEffect(() => {
    if (n >= 2) snd.level();
  }, [n]);
  return (
    <div className="text-center">
      <Sterren score={r.score} groot />
      <p className="mt-3 text-2xl font-bold">
        {n === 3
          ? "Fantastisch!"
          : n === 2
            ? "Goed gedaan!"
            : n === 1
              ? "Aardig!"
              : "Volgende keer beter!"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{r.tekst}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Pill tone="brand">⭐ {r.punten} punten</Pill>
        <Pill tone={r.score >= 0.55 ? "good" : "warn"}>{Math.round(r.score * 100)}%</Pill>
      </div>
      {extra}
      <div className={cn("mt-5 grid gap-2.5", onOpnieuw && onVerder ? "sm:grid-cols-2" : "")}>
        {onOpnieuw ? (
          <BigButton variant="soft" onClick={onOpnieuw}>
            🔁 Nog een keer
          </BigButton>
        ) : null}
        {onVerder ? <BigButton onClick={onVerder}>{verderLabel}</BigButton> : null}
      </div>
    </div>
  );
}

/* ---------- Koppel: klik links en rechts het juiste paar ---------- */
export function Koppel({
  paren,
  onKlaar,
}: {
  paren: [string, string][];
  onKlaar: (r: MiniResult) => void;
}) {
  const links = useMemo(() => shuffle(paren.map((p) => p[0])), [paren]);
  const rechts = useMemo(() => shuffle(paren.map((p) => p[1])), [paren]);
  const [l, setL] = useState<string | null>(null);
  const [goed, setGoed] = useState<string[]>([]);
  const [fout, setFout] = useState<string | null>(null);
  const [fouten, setFouten] = useState(0);
  const [combo, setCombo] = useState(0);
  const [sec, setSec] = useState(0);
  const start = useRef(performance.now());
  const klaar = goed.length === paren.length;

  useEffect(() => {
    if (klaar) return;
    const id = window.setInterval(
      () => setSec(Math.floor((performance.now() - start.current) / 1000)),
      250,
    );
    return () => window.clearInterval(id);
  }, [klaar]);

  useEffect(() => {
    if (!klaar) return;
    snd.juich();
    const score = clamp01(1 - fouten * 0.12 - Math.max(0, sec - paren.length * 4) * 0.012);
    const t = window.setTimeout(
      () =>
        onKlaar({
          score,
          punten: Math.max(0, 100 - fouten * 10 - sec),
          tekst: `Alles gekoppeld in ${sec} seconden met ${fouten} ${fouten === 1 ? "fout" : "fouten"}.`,
        }),
      700,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klaar]);

  const kiesRechts = (r: string) => {
    if (!l) {
      setFout(r);
      setTimeout(() => setFout(null), 300);
      return;
    }
    if (paren.some((p) => p[0] === l && p[1] === r)) {
      setGoed([...goed, l]);
      setL(null);
      setCombo((c) => c + 1);
      snd.combo(combo + 1);
    } else {
      setFout(r);
      setFouten((f) => f + 1);
      setCombo(0);
      snd.fout();
      setTimeout(() => setFout(null), 500);
    }
  };
  const nrVan = (links: string) => goed.indexOf(links) + 1;
  const rechtsNr = (r: string) => {
    const p = paren.find((x) => x[1] === r);
    return p && goed.includes(p[0]) ? nrVan(p[0]) : 0;
  };

  return (
    <div>
      <Hud>
        <HudPill tone="muted">⏱ {sec}s</HudPill>
        <HudPill tone="good">
          ✅ {goed.length}/{paren.length}
        </HudPill>
        <HudPill tone={fouten ? "bad" : "muted"}>❌ {fouten}</HudPill>
        {combo >= 3 ? <HudPill tone="warn">🔥 ×{combo}</HudPill> : null}
      </Hud>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          {links.map((x) => (
            <button
              key={x}
              disabled={goed.includes(x)}
              onClick={() => {
                snd.klik();
                setL(x);
              }}
              className={cn(
                "relative w-full rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all",
                goed.includes(x)
                  ? "border-mint bg-mint/12 text-mint"
                  : l === x
                    ? "scale-[1.02] border-brand bg-brand/10 shadow-md"
                    : "border-border bg-card hover:border-brand",
              )}
            >
              {goed.includes(x) ? (
                <span className="absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-mint text-[10px] text-white">
                  {nrVan(x)}
                </span>
              ) : null}
              {x}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {rechts.map((x) => {
            const nr = rechtsNr(x);
            return (
              <button
                key={x}
                disabled={nr > 0}
                onClick={() => kiesRechts(x)}
                className={cn(
                  "relative w-full rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all",
                  nr > 0
                    ? "border-mint bg-mint/12 text-mint"
                    : fout === x
                      ? "animate-shake border-rose bg-rose/10 text-rose"
                      : l
                        ? "border-brand/40 bg-card hover:border-brand hover:bg-brand/5"
                        : "border-border bg-card hover:border-brand",
                )}
              >
                {nr > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-mint text-[10px] text-white">
                    {nr}
                  </span>
                ) : null}
                {x}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {klaar
          ? "🎉 Alles gekoppeld!"
          : "Kies links een woord, dan rechts het bijpassende antwoord. Minder fouten = meer sterren."}
      </p>
    </div>
  );
}

/* ---------- Snel: zoveel mogelijk sommen goed binnen de tijd ---------- */
const normaliseerGetal = (s: string) =>
  s.trim().replace(/[−–—]/g, "-").replace(".", ",").replace(/\s+/g, "");

export function Snel({
  sommen,
  seconden,
  onKlaar,
}: {
  sommen: [string, string][];
  seconden: number;
  onKlaar: (r: MiniResult) => void;
}) {
  const lijst = useMemo(() => shuffle(sommen), [sommen]);
  const [tijd, setTijd] = useState(seconden);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [punten, setPunten] = useState(0);
  const [combo, setCombo] = useState(0);
  const [invoer, setInvoer] = useState("");
  const [flash, setFlash] = useState<{ ok: boolean; antwoord: string } | null>(null);
  const klaar = tijd <= 0 || i >= lijst.length;
  const gemeld = useRef(false);

  useEffect(() => {
    if (klaar) return;
    const t = setTimeout(() => setTijd((x) => Math.max(0, x - 0.1)), 100);
    return () => clearTimeout(t);
  }, [klaar, tijd]);

  useEffect(() => {
    if (!klaar || gemeld.current) return;
    gemeld.current = true;
    snd.gong();
    onKlaar({
      score: clamp01(score / Math.max(1, lijst.length * 0.8)),
      punten,
      tekst: `${score} van de ${lijst.length} sommen goed${tijd > 0 ? ` met ${Math.ceil(tijd)} seconden over` : ""}.`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klaar]);

  if (klaar) return <p className="py-6 text-center text-lg font-bold">⏱ Tijd! Even tellen…</p>;

  const som = lijst[i]!;
  const verstuur = () => {
    if (!invoer.trim()) return;
    const ok = normaliseerGetal(invoer) === normaliseerGetal(som[1]);
    if (ok) {
      const c = combo + 1;
      setScore(score + 1);
      setCombo(c);
      setPunten(punten + 10 + Math.min(c, 10) * 2);
      snd.combo(c);
    } else {
      setCombo(0);
      snd.fout();
    }
    setFlash({ ok, antwoord: som[1] });
    setTimeout(() => setFlash(null), ok ? 250 : 900);
    setInvoer("");
    setI(i + 1);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        verstuur();
      }}
    >
      <Hud>
        <HudPill tone={tijd < 10 ? "bad" : "warn"}>⏱ {Math.ceil(tijd)}s</HudPill>
        <HudPill tone="good">✅ {score}</HudPill>
        <HudPill tone="brand">⭐ {punten}</HudPill>
        {combo >= 3 ? <HudPill tone="warn">🔥 combo ×{combo}</HudPill> : null}
      </Hud>
      <TijdBalk fractie={tijd / seconden} />
      <p
        className={cn(
          "rounded-2xl py-6 text-center text-3xl font-bold transition-colors",
          flash?.ok ? "bg-mint/15" : flash ? "bg-rose/15" : "bg-secondary",
        )}
      >
        {som[0]} = ?
      </p>
      <p className="mt-1 h-5 text-center text-sm font-semibold text-rose">
        {flash && !flash.ok ? `Vorige was ${flash.antwoord}` : ""}
      </p>
      <div className="mt-1 flex gap-2">
        <input
          autoFocus
          inputMode="text"
          value={invoer}
          onChange={(e) => setInvoer(e.target.value)}
          placeholder="antwoord"
          className="min-w-0 flex-1 rounded-2xl border-2 bg-card px-4 py-3 text-center text-xl font-bold outline-none focus:border-brand"
        />
        <button className="rounded-2xl bg-brand px-5 text-lg font-bold text-primary-foreground">
          ↵
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Tip: negatieve getallen typ je met een min, bijvoorbeeld -7. Druk op Enter.
      </p>
    </form>
  );
}

/* ---------- Volgorde: zet items op de goede volgorde ---------- */
export function Volgorde({
  items,
  onKlaar,
}: {
  items: string[];
  onKlaar: (r: MiniResult) => void;
}) {
  const pool = useMemo(() => shuffle(items), [items]);
  const [gekozen, setGekozen] = useState<string[]>([]);
  const [fout, setFout] = useState<string | null>(null);
  const [fouten, setFouten] = useState(0);
  const [hints, setHints] = useState(0);
  const [hintItem, setHintItem] = useState<string | null>(null);
  const klaar = gekozen.length === items.length;

  useEffect(() => {
    if (!klaar) return;
    snd.juich();
    const t = window.setTimeout(
      () =>
        onKlaar({
          score: clamp01(1 - fouten * 0.15 - hints * 0.2),
          punten: Math.max(0, 100 - fouten * 15 - hints * 20),
          tekst: `Tijdlijn compleet met ${fouten} ${fouten === 1 ? "fout" : "fouten"}${hints ? ` en ${hints} hint${hints > 1 ? "s" : ""}` : ""}.`,
        }),
      700,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klaar]);

  const kies = (x: string) => {
    if (items[gekozen.length] === x) {
      setGekozen([...gekozen, x]);
      setHintItem(null);
      snd.combo(gekozen.length + 1);
    } else {
      setFout(x);
      setFouten((f) => f + 1);
      snd.fout();
      setTimeout(() => setFout(null), 500);
    }
  };

  return (
    <div>
      <Hud>
        <HudPill tone="good">
          📜 {gekozen.length}/{items.length}
        </HudPill>
        <HudPill tone={fouten ? "bad" : "muted"}>❌ {fouten}</HudPill>
        <HudPill tone="muted">💡 {hints} hints</HudPill>
      </Hud>
      <ol className="relative mb-3 space-y-1.5 border-l-4 border-mint/40 pl-4">
        {gekozen.map((x, n) => (
          <li
            key={x}
            className="animate-pop-in rounded-xl bg-mint/12 px-3 py-2 text-sm font-semibold text-mint"
          >
            <span className="absolute -left-[11px] mt-1 h-4 w-4 rounded-full border-2 border-card bg-mint" />
            {n + 1}. {x}
          </li>
        ))}
        {!klaar ? (
          <li className="rounded-xl border-2 border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
            {gekozen.length + 1}. … wat kwam hierna?
          </li>
        ) : null}
      </ol>
      <div className="flex flex-wrap gap-2">
        {pool
          .filter((x) => !gekozen.includes(x))
          .map((x) => (
            <button
              key={x}
              onClick={() => kies(x)}
              className={cn(
                "rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all",
                fout === x
                  ? "animate-shake border-rose bg-rose/10 text-rose"
                  : hintItem === x
                    ? "animate-pulse border-amber bg-amber/15"
                    : "border-border bg-card hover:border-brand",
              )}
            >
              {x}
            </button>
          ))}
      </div>
      {!klaar ? (
        <button
          type="button"
          className="mt-3 text-xs font-semibold text-brand underline-offset-2 hover:underline"
          onClick={() => {
            setHints((h) => h + 1);
            setHintItem(items[gekozen.length] ?? null);
          }}
        >
          💡 Hint (kost punten)
        </button>
      ) : null}
    </div>
  );
}

/* ---------- Sorteer: elk ding naar de goede kant ---------- */
export function Sorteer({
  bakken,
  items,
  seconden,
  onKlaar,
}: {
  bakken: [string, string];
  items: [string, 0 | 1][];
  seconden: number;
  onKlaar: (r: MiniResult) => void;
}) {
  const lijst = useMemo(() => shuffle(items), [items]);
  const [i, setI] = useState(0);
  const [goed, setGoed] = useState(0);
  const [tijd, setTijd] = useState(seconden);
  const [flits, setFlits] = useState<{ kant: 0 | 1; ok: boolean } | null>(null);
  const [combo, setCombo] = useState(0);
  const klaar = i >= lijst.length || tijd <= 0;
  const gemeld = useRef(false);

  useEffect(() => {
    if (klaar) return;
    const t = setTimeout(() => setTijd((x) => Math.max(0, x - 0.1)), 100);
    return () => clearTimeout(t);
  }, [klaar, tijd]);

  useEffect(() => {
    if (!klaar || gemeld.current) return;
    gemeld.current = true;
    snd.gong();
    onKlaar({
      score: clamp01((goed / lijst.length) * 0.85 + (tijd / seconden) * 0.15),
      punten: goed * 10 + Math.round(tijd),
      tekst: `${goed} van de ${lijst.length} goed gesorteerd.`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klaar]);

  const kies = useCallback(
    (kant: 0 | 1) => {
      if (klaar || flits) return;
      const item = lijst[i]!;
      const ok = item[1] === kant;
      if (ok) {
        setGoed((g) => g + 1);
        setCombo((c) => c + 1);
        snd.combo(combo + 1);
      } else {
        setCombo(0);
        snd.fout();
      }
      setFlits({ kant, ok });
      setTimeout(
        () => {
          setFlits(null);
          setI((x) => x + 1);
        },
        ok ? 220 : 600,
      );
    },
    [klaar, flits, lijst, i, combo],
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") kies(0);
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") kies(1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [kies]);

  if (klaar) return <p className="py-6 text-center text-lg font-bold">Even tellen…</p>;
  const item = lijst[i]!;

  return (
    <div>
      <Hud>
        <HudPill tone={tijd < 8 ? "bad" : "warn"}>⏱ {Math.ceil(tijd)}s</HudPill>
        <HudPill tone="good">
          ✅ {goed}/{lijst.length}
        </HudPill>
        {combo >= 3 ? <HudPill tone="warn">🔥 ×{combo}</HudPill> : null}
      </Hud>
      <TijdBalk fractie={tijd / seconden} />
      <div className="flex h-28 items-center justify-center">
        <span
          key={i}
          className={cn(
            "animate-pop-in rounded-2xl border-2 bg-card px-6 py-4 text-2xl font-bold shadow-sm transition-transform",
            flits?.ok === false && "animate-shake border-rose",
            flits?.ok &&
              (flits.kant === 0 ? "-translate-x-24 opacity-0" : "translate-x-24 opacity-0"),
          )}
        >
          {item[0]}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {bakken.map((b, kant) => (
          <button
            key={b}
            onClick={() => kies(kant as 0 | 1)}
            className={cn(
              "rounded-2xl border-2 py-5 text-lg font-bold transition-all active:scale-95",
              flits?.kant === kant
                ? flits.ok
                  ? "border-mint bg-mint/15"
                  : "border-rose bg-rose/10"
                : "border-border bg-secondary hover:border-brand",
            )}
          >
            {kant === 0 ? "← " : ""}
            {b}
            {kant === 1 ? " →" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
