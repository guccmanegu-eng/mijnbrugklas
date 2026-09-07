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
      { property: "og:description", content: "Vul je naam in en kies welke klas je wilt simuleren." },
    ],
  }),
  component: ProfielPagina,
});

const KLASSEN = ["Brugklas", "Havo/Vwo", "Vmbo"];

function ProfielPagina() {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  const [naam, setNaam] = useState("");
  const [klas, setKlas] = useState("Brugklas");
  const [stap, setStap] = useState<"invullen" | "klaar">("invullen");

  const bevestig = () => {
    if (naam.trim().length < 2) return;
    dispatch({ type: "SETUP", naam: naam.trim(), classType: klas });
    setStap("klaar");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md">
        {stap === "invullen" ? (
          <Card className="p-6">
            <h1 className="text-2xl font-bold">Hoe heet je?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Alleen je voornaam, meer hoeven we niet te weten.</p>
            <input
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              placeholder="Voornaam"
              className="mt-4 w-full rounded-2xl border-2 border-border bg-background px-4 py-3.5 text-base font-semibold outline-none focus:border-brand"
            />

            <h2 className="mt-7 text-lg font-bold">Welke klas ga je simuleren?</h2>
            <div className="mt-3 grid gap-2.5">
              {KLASSEN.map((k) => (
                <button
                  key={k}
                  onClick={() => setKlas(k)}
                  className={cn(
                    "rounded-2xl border-2 px-4 py-3.5 text-left text-sm font-semibold transition-all",
                    klas === k ? "border-brand bg-brand/8 text-brand" : "border-border hover:bg-accent",
                  )}
                >
                  {k}
                </button>
              ))}
            </div>

            <BigButton className="mt-6" disabled={naam.trim().length < 2} onClick={bevestig}>
              Maak mijn profiel →
            </BigButton>
          </Card>
        ) : (
          <Card className="p-7 text-center">
            <p className="text-5xl">👋</p>
            <h1 className="mt-3 text-2xl font-bold">Hoi, {state.playerName}!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Je eerste schoolweek in de {state.classType.toLowerCase()} begint maandag.
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
