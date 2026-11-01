import { useEffect, useMemo, useState } from "react";
import type { MiniGameDef } from "@/lib/game/data";
import { BigButton, Card, Pill } from "./bits";
import { cn } from "@/lib/utils";

const shuffle = <T,>(a: T[]) => {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j]!, c[i]!];
  }
  return c;
};

export function MiniGame({ game, onKlaar }: { game: MiniGameDef; onKlaar: () => void }) {
  return (
    <Card className="border-2 border-brand/30">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">🎮 {game.titel}</h2>
        <Pill tone="brand">Minigame</Pill>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{game.uitleg}</p>
      {game.type === "koppel" ? (
        <Koppel paren={game.paren} onKlaar={onKlaar} />
      ) : game.type === "snel" ? (
        <Snel sommen={game.sommen} seconden={game.seconden} onKlaar={onKlaar} />
      ) : (
        <Volgorde items={game.items} onKlaar={onKlaar} />
      )}
    </Card>
  );
}

/* Koppel: klik links en rechts het juiste paar */
function Koppel({ paren, onKlaar }: { paren: [string, string][]; onKlaar: () => void }) {
  const links = useMemo(() => shuffle(paren.map((p) => p[0])), [paren]);
  const rechts = useMemo(() => shuffle(paren.map((p) => p[1])), [paren]);
  const [l, setL] = useState<string | null>(null);
  const [goed, setGoed] = useState<string[]>([]);
  const [fout, setFout] = useState<string | null>(null);
  const klaar = goed.length === paren.length;

  const kiesRechts = (r: string) => {
    if (!l) return;
    if (paren.some((p) => p[0] === l && p[1] === r)) {
      setGoed([...goed, l]);
      setL(null);
    } else {
      setFout(r);
      setTimeout(() => setFout(null), 500);
    }
  };
  const isRechtsGoed = (r: string) => paren.some((p) => p[1] === r && goed.includes(p[0]));

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          {links.map((x) => (
            <button
              key={x}
              disabled={goed.includes(x)}
              onClick={() => setL(x)}
              className={cn(
                "w-full rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all",
                goed.includes(x)
                  ? "border-mint bg-mint/12 text-mint"
                  : l === x
                    ? "border-brand bg-brand/10"
                    : "border-border bg-card hover:border-brand",
              )}
            >
              {x}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {rechts.map((x) => (
            <button
              key={x}
              disabled={isRechtsGoed(x)}
              onClick={() => kiesRechts(x)}
              className={cn(
                "w-full rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all",
                isRechtsGoed(x)
                  ? "border-mint bg-mint/12 text-mint"
                  : fout === x
                    ? "animate-pulse border-rose bg-rose/10 text-rose"
                    : "border-border bg-card hover:border-brand",
              )}
            >
              {x}
            </button>
          ))}
        </div>
      </div>
      {klaar ? (
        <BigButton className="mt-4" onClick={onKlaar}>
          🎉 Alles gekoppeld! Door naar de opdrachten →
        </BigButton>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">Kies links een woord, dan rechts het bijpassende antwoord.</p>
      )}
    </div>
  );
}

/* Snel: zoveel mogelijk sommen goed binnen de tijd */
function Snel({ sommen, seconden, onKlaar }: { sommen: [string, string][]; seconden: number; onKlaar: () => void }) {
  const lijst = useMemo(() => shuffle(sommen), [sommen]);
  const [gestart, setGestart] = useState(false);
  const [tijd, setTijd] = useState(seconden);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [invoer, setInvoer] = useState("");
  const [flash, setFlash] = useState<"goed" | "fout" | null>(null);
  const klaar = gestart && (tijd <= 0 || i >= lijst.length);

  useEffect(() => {
    if (!gestart || klaar) return;
    const t = setTimeout(() => setTijd((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [gestart, klaar, tijd]);

  if (!gestart)
    return <BigButton onClick={() => setGestart(true)}>▶ Start ({seconden} seconden)</BigButton>;

  if (klaar)
    return (
      <div className="text-center">
        <p className="text-4xl">{score >= lijst.length / 2 ? "🏆" : "⚡"}</p>
        <p className="mt-2 text-xl font-bold">
          {score} van {lijst.length} goed!
        </p>
        <BigButton className="mt-4" onClick={onKlaar}>
          Door naar de opdrachten →
        </BigButton>
      </div>
    );

  const som = lijst[i]!;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const ok = invoer.trim().replace(".", ",") === som[1];
        if (ok) setScore(score + 1);
        setFlash(ok ? "goed" : "fout");
        setTimeout(() => setFlash(null), 300);
        setInvoer("");
        setI(i + 1);
      }}
    >
      <div className="mb-3 flex justify-between text-sm font-semibold">
        <span>⏱ {tijd}s</span>
        <span>⭐ {score}</span>
      </div>
      <p
        className={cn(
          "rounded-2xl py-6 text-center text-3xl font-bold transition-colors",
          flash === "goed" ? "bg-mint/15" : flash === "fout" ? "bg-rose/15" : "bg-secondary",
        )}
      >
        {som[0]} = ?
      </p>
      <input
        autoFocus
        inputMode="numeric"
        value={invoer}
        onChange={(e) => setInvoer(e.target.value)}
        className="mt-3 w-full rounded-2xl border-2 bg-card px-4 py-3 text-center text-xl font-bold outline-none focus:border-brand"
      />
    </form>
  );
}

/* Volgorde: zet items op de goede volgorde door ze aan te klikken */
function Volgorde({ items, onKlaar }: { items: string[]; onKlaar: () => void }) {
  const pool = useMemo(() => shuffle(items), [items]);
  const [gekozen, setGekozen] = useState<string[]>([]);
  const [fout, setFout] = useState<string | null>(null);
  const klaar = gekozen.length === items.length;

  const kies = (x: string) => {
    if (items[gekozen.length] === x) setGekozen([...gekozen, x]);
    else {
      setFout(x);
      setTimeout(() => setFout(null), 500);
    }
  };

  return (
    <div>
      <ol className="mb-3 space-y-1.5">
        {gekozen.map((x, n) => (
          <li key={x} className="rounded-xl bg-mint/12 px-3 py-2 text-sm font-semibold text-mint">
            {n + 1}. {x}
          </li>
        ))}
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
                fout === x ? "animate-pulse border-rose bg-rose/10 text-rose" : "border-border bg-card hover:border-brand",
              )}
            >
              {x}
            </button>
          ))}
      </div>
      {klaar ? (
        <BigButton className="mt-4" onClick={onKlaar}>
          🎉 Goed op volgorde! Door naar de opdrachten →
        </BigButton>
      ) : null}
    </div>
  );
}
