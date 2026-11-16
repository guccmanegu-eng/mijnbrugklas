import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/martinuscollege-logo.png.asset.json";
import { useGame, fmtTijd } from "@/lib/game/state";
import { DAY_NAMES } from "@/lib/game/data";
import { levelInfo } from "@/lib/game/events";
import { isGedempt, opGeluidWijziging, snd, zetGedempt } from "@/lib/game/sound";

const NAV = [
  { to: "/spel", label: "Dashboard", icon: "🏠", exact: true, mobiel: true },
  { to: "/spel/planning", label: "Mijn planning", icon: "📅", mobiel: true },
  { to: "/spel/huiswerk", label: "Huiswerk", icon: "📚", mobiel: true },
  { to: "/spel/rugzak", label: "Rugzak", icon: "🎒", mobiel: true },
  { to: "/spel/school", label: "School", icon: "🗺️", mobiel: true },
  { to: "/spel/speelhal", label: "Speelhal", icon: "🕹️", mobiel: true },
  { to: "/spel/vaardigheden", label: "Vaardigheden", icon: "⭐", mobiel: false },
  { to: "/spel/voortgang", label: "Mijn voortgang", icon: "📊", mobiel: false },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { state } = useGame();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lvl = levelInfo(state.xp);

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to || pathname === `${to}/` : pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-background">
      <XpMeldingen />

      {/* mobiele topbalk */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-2 backdrop-blur lg:hidden">
        <LevelBadge level={lvl.level} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">
            {state.playerName} · {lvl.titel}
          </p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-amber transition-all duration-700"
              style={{ width: `${lvl.pct}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-bold tabular-nums text-muted-foreground">
          {DAY_NAMES[state.currentDag]?.slice(0, 2)} {fmtTijd(state.minuten)}
        </span>
        <GeluidKnop />
      </div>

      <div className="mx-auto flex w-full max-w-6xl">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border p-5 lg:flex">
          <Link to="/" className="mb-6 flex items-center gap-2.5">
            <img src={logo.url} alt="Martinuscollege" className="h-16 w-auto animate-float-slow" />
            <span className="leading-tight">
              <span className="block text-lg font-extrabold">Brugklas-game</span>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-rose">
                Grootebroek
              </span>
            </span>
          </Link>
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors",
                isActive(n.to, "exact" in n ? n.exact : false)
                  ? "bg-brand/12 text-brand"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              <span className="text-lg">{n.icon}</span>
              {n.label}
            </Link>
          ))}
          <div className="mt-auto rounded-2xl bg-secondary p-4 text-sm">
            <div className="flex items-center gap-3">
              <LevelBadge level={lvl.level} />
              <div className="min-w-0">
                <p className="truncate font-extrabold">👋 {state.playerName || "Speler"}</p>
                <p className="text-xs font-semibold text-amber">{lvl.titel}</p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-card">
              <div
                className="h-full rounded-full bg-amber transition-all duration-700"
                style={{ width: `${lvl.pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              ⭐ {state.xp} XP · nog {lvl.volgende - state.xp} tot level {lvl.level + 1}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-muted-foreground">
                {DAY_NAMES[state.currentDag]} · {fmtTijd(state.minuten)}
              </p>
              <GeluidKnop />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pt-5 pb-28 sm:px-7 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-6">
          {NAV.filter((n) => n.mobiel).map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors",
                isActive(n.to, "exact" in n ? n.exact : false)
                  ? "text-brand"
                  : "text-muted-foreground",
              )}
            >
              <span className="text-lg">{n.icon}</span>
              {n.label.replace("Mijn ", "")}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

function LevelBadge({ level }: { level: number }) {
  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-amber to-rose text-sm font-extrabold text-white shadow-md">
      {level}
      <span className="absolute -bottom-1 rounded-full bg-card px-1 text-[8px] font-bold text-muted-foreground">
        LVL
      </span>
    </span>
  );
}

function GeluidKnop() {
  const [uit, setUit] = useState(false);
  useEffect(() => {
    setUit(isGedempt());
    return opGeluidWijziging(setUit);
  }, []);
  return (
    <button
      type="button"
      onClick={() => {
        zetGedempt(!uit);
        if (uit) snd.klik();
      }}
      className="rounded-xl px-2 py-1 text-lg hover:bg-accent"
      aria-label={uit ? "Geluid aanzetten" : "Geluid uitzetten"}
      title={uit ? "Geluid aanzetten" : "Geluid uitzetten"}
    >
      {uit ? "🔇" : "🔊"}
    </button>
  );
}

/** Zwevende "+XP"-meldingen en een level-up-banner. */
function XpMeldingen() {
  const { state } = useGame();
  const vorige = useRef<number | null>(null);
  const gestart = useRef(0);
  const [pops, setPops] = useState<{ id: number; xp: number }[]>([]);
  const [levelUp, setLevelUp] = useState<{ level: number; titel: string } | null>(null);

  useEffect(() => {
    gestart.current = performance.now();
  }, []);

  useEffect(() => {
    const oud = vorige.current;
    vorige.current = state.xp;
    // negeer het laden van een opgeslagen spel
    if (oud === null || performance.now() - gestart.current < 800) return;
    const diff = state.xp - oud;
    if (diff <= 0) return;
    const id = Date.now() + Math.random();
    setPops((p) => [...p.slice(-3), { id, xp: diff }]);
    window.setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1700);
    const a = levelInfo(oud);
    const b = levelInfo(state.xp);
    if (b.level > a.level) {
      snd.level();
      setLevelUp({ level: b.level, titel: b.titel });
      window.setTimeout(() => setLevelUp(null), 3200);
    }
  }, [state.xp]);

  return (
    <>
      <div className="pointer-events-none fixed right-4 top-16 z-[70] flex flex-col items-end gap-1.5 lg:top-5">
        {pops.map((p) => (
          <span
            key={p.id}
            className="animate-xp rounded-full bg-amber px-3 py-1 text-sm font-extrabold text-white shadow-lg"
          >
            +{p.xp} XP
          </span>
        ))}
      </div>
      {levelUp ? (
        <div className="pointer-events-none fixed inset-x-0 top-24 z-[70] flex justify-center px-4">
          <div className="animate-pop-in rounded-3xl border-2 border-amber bg-card px-6 py-4 text-center shadow-2xl bg-confetti">
            <p className="text-4xl">🎉</p>
            <p className="font-display text-2xl font-extrabold">Level {levelUp.level}!</p>
            <p className="text-sm font-semibold text-amber">Je bent nu {levelUp.titel}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
