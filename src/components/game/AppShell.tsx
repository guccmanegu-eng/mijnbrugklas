import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/martinuscollege-logo.png.asset.json";
import { useGame, fmtTijd } from "@/lib/game/state";
import { DAY_NAMES } from "@/lib/game/data";

const NAV = [
  { to: "/spel", label: "Dashboard", icon: "🏠", exact: true },
  { to: "/spel/planning", label: "Mijn planning", icon: "📅" },
  { to: "/spel/huiswerk", label: "Huiswerk", icon: "📚" },
  { to: "/spel/rugzak", label: "Rugzak", icon: "🎒" },
  { to: "/spel/school", label: "School", icon: "🗺️" },
  { to: "/spel/vaardigheden", label: "Vaardigheden", icon: "⭐" },
  { to: "/spel/voortgang", label: "Mijn voortgang", icon: "📊" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { state } = useGame();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to || pathname === `${to}/` : pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-1 border-r border-border p-5 lg:flex">
          <Link to="/" className="mb-6 flex items-center gap-2.5">
            <img src={logo.url} alt="Martinuscollege" className="h-10 w-auto animate-float-slow" />
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
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
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
            <p className="font-extrabold">👋 {state.playerName || "Speler"}</p>
            <p className="text-muted-foreground">
              {DAY_NAMES[state.currentDag]} · {fmtTijd(state.minuten)}
            </p>
            <p className="mt-1 text-muted-foreground">⭐ {state.xp} XP</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pt-5 pb-28 sm:px-7 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-6">
          {NAV.filter((n) => n.label !== "Mijn voortgang").map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors",
                isActive(n.to, "exact" in n ? n.exact : false) ? "text-brand" : "text-muted-foreground",
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
