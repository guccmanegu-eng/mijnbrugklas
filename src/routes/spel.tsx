import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/game/AppShell";
import { BigButton, Card } from "@/components/game/bits";
import { useGame } from "@/lib/game/state";
import { SITUATIONS } from "@/lib/game/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/spel")({
  head: () => ({
    meta: [
      { title: "Simulatie — Brugklas" },
      { name: "description", content: "Speel je eerste schoolweek: lessen, huiswerk, planning en toets." },
      { property: "og:title", content: "Simulatie — Brugklas" },
      { property: "og:description", content: "Speel je eerste schoolweek in de Brugklas-simulator." },
    ],
  }),
  component: SpelLayout,
});

function SpelLayout() {
  const { state } = useGame();

  if (!state.playerName) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <Card className="max-w-sm text-center">
          <p className="text-4xl">🎒</p>
          <h1 className="mt-3 text-xl font-bold">Maak eerst je profiel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vul je naam in en kies je klas, dan begint je schoolweek.
          </p>
          <Link to="/profiel" className="mt-5 block">
            <BigButton>Naar profiel →</BigButton>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <AppShell>
      <SituationDialog />
      <Outlet />
    </AppShell>
  );
}

function SituationDialog() {
  const { state, dispatch } = useGame();
  const [gekozen, setGekozen] = useState<number | null>(null);
  const situatie = SITUATIONS.find((s) => s.id === state.pendingSituation);
  if (!situatie) return null;

  const optie = gekozen === null ? null : situatie.opties[gekozen];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <Card className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-b-none sm:rounded-3xl">
        <p className="text-4xl">{situatie.icon}</p>
        <h2 className="mt-2 text-xl font-bold">{situatie.titel}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{situatie.vraag}</p>

        <div className="mt-4 space-y-2.5">
          {situatie.opties.map((o, i) => (
            <button
              key={o.label}
              disabled={gekozen !== null}
              onClick={() => setGekozen(i)}
              className={cn(
                "w-full rounded-2xl border-2 px-4 py-3.5 text-left text-sm font-semibold transition-all",
                gekozen === i
                  ? o.goed
                    ? "border-mint bg-mint/12 text-mint"
                    : "border-rose bg-rose/10 text-rose"
                  : gekozen !== null
                    ? "border-border opacity-50"
                    : "border-border hover:border-brand hover:bg-brand/5",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        {optie ? (
          <>
            <div
              className={cn(
                "mt-4 rounded-2xl p-4 text-sm",
                optie.goed ? "bg-mint/12 text-mint" : "bg-amber/15 text-amber",
              )}
            >
              <p className="font-bold">{optie.goed ? "✅ Goede keuze" : "💡 Denk hier eens over na"}</p>
              <p className="mt-1 text-foreground/80">{optie.feedback}</p>
            </div>
            <BigButton
              className="mt-4"
              onClick={() => {
                dispatch({ type: "SITUATIE_ANTWOORD", id: situatie.id, optie: gekozen! });
                setGekozen(null);
              }}
            >
              Verder →
            </BigButton>
          </>
        ) : null}
      </Card>
    </div>
  );
}
