import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BigButton, Card } from "@/components/game/bits";
import { useGame } from "@/lib/game/state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profiel")({
  head: () => ({
    meta: [
      { title: "Jouw profiel — Brugklas" },
      { name: "description", content: "Vul je naam in en kies welke klas je wilt simuleren." },
      { property: "og:title", content: "Jouw profiel — Brugklas" },
      {
        property: "og:description",
        content: "Vul je naam in en kies welke klas je wilt simuleren.",
      },
    ],
  }),
  component: ProfielPagina,
});

const KLASSEN = ["Vmbo basis/kader", "Vmbo-tl/mavo", "Havo/vwo"];

function ProfielPagina() {
  const { state, dispatch, geladen } = useGame();
  const navigate = useNavigate();
  const [naam, setNaam] = useState("");
  const [klas, setKlas] = useState(KLASSEN[2]!);
  const [stap, setStap] = useState<"invullen" | "klaar">("invullen");
  const [opnieuw, setOpnieuw] = useState(false);
  const schoon = naam.trim().replace(/\s+/g, " ").slice(0, 24);
  const bezig = geladen && !!state.playerName && state.phase !== "setup" && state.phase !== "klaar";

  const bevestig = () => {
    if (schoon.length < 2) return;
    dispatch({ type: "SETUP", naam: schoon, classType: klas });
    setStap("klaar");
  };

  if (!geladen) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-5"
        role="status"
        aria-live="polite"
      >
        <p className="animate-pulse text-sm font-semibold text-muted-foreground">🎒 Even laden…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md">
        {bezig && !opnieuw && stap === "invullen" ? (
          <Card className="p-6 text-center">
            <p className="text-5xl" aria-hidden="true">
              🎒
            </p>
            <h1 className="mt-3 text-2xl font-bold">Welkom terug, {state.playerName}!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Je bent nog bezig met je week (dag {state.currentDag + 1} van 5). Wil je verder spelen
              of opnieuw beginnen?
            </p>
            <BigButton className="mt-6" onClick={() => navigate({ to: "/spel" })}>
              Verder spelen →
            </BigButton>
            <BigButton variant="ghost" className="mt-2.5" onClick={() => setOpnieuw(true)}>
              Opnieuw beginnen
            </BigButton>
            <p className="mt-3 text-xs text-muted-foreground">
              Opnieuw beginnen wist je huidige week. Je speelhal-records blijven bewaard.
            </p>
          </Card>
        ) : stap === "invullen" ? (
          <Card className="p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                bevestig();
              }}
            >
              <label htmlFor="voornaam" className="block text-2xl font-bold">
                Hoe heet je?
              </label>
              <p className="mt-1 text-sm text-muted-foreground">
                Alleen je voornaam, meer hoeven we niet te weten. Alles blijft op dit apparaat.
              </p>
              <input
                id="voornaam"
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                placeholder="Voornaam"
                autoComplete="given-name"
                maxLength={24}
                autoFocus
                className="mt-4 w-full rounded-2xl border-2 border-border bg-background px-4 py-3.5 text-base font-semibold outline-none focus:border-brand"
              />

              <fieldset className="mt-7">
                <legend className="text-lg font-bold">Naar welk niveau ga je?</legend>
                <div className="mt-3 grid gap-2.5" role="radiogroup">
                  {KLASSEN.map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={klas === k}
                      onClick={() => setKlas(k)}
                      className={cn(
                        "rounded-2xl border-2 px-4 py-3.5 text-left text-sm font-semibold transition-all",
                        klas === k
                          ? "border-brand bg-brand/8 text-brand"
                          : "border-border hover:bg-accent",
                      )}
                    >
                      {klas === k ? "✅ " : ""}
                      {k}
                    </button>
                  ))}
                </div>
              </fieldset>

              <BigButton type="submit" className="mt-6" disabled={schoon.length < 2}>
                {bezig ? "Begin een nieuwe week →" : "Maak mijn profiel →"}
              </BigButton>
              {bezig ? (
                <button
                  type="button"
                  onClick={() => setOpnieuw(false)}
                  className="mt-3 w-full text-sm font-semibold text-brand hover:underline"
                >
                  ← Toch verder met mijn huidige week
                </button>
              ) : null}
            </form>
          </Card>
        ) : (
          <Card className="p-7 text-center">
            <p className="text-5xl" aria-hidden="true">
              👋
            </p>
            <h1 className="mt-3 text-2xl font-bold">Hoi, {state.playerName}!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Je eerste schoolweek in de brugklas ({state.classType.toLowerCase()}) begint maandag.
              <br />
              Ben jij er klaar voor?
            </p>
            <BigButton className="mt-6" onClick={() => navigate({ to: "/spel" })}>
              Start mijn eerste week →
            </BigButton>
          </Card>
        )}
      </div>
    </div>
  );
}
