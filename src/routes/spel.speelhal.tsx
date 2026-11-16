import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BigButton, Card, Pill, SectionTitle } from "@/components/game/bits";
import { ResultaatKaart } from "@/components/game/MiniGame";
import { GameHost } from "@/components/game/minigames";
import { ARCADE, type GameId, type MiniResult } from "@/lib/game/events";
import { useGame } from "@/lib/game/state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/spel/speelhal")({
  head: () => ({
    meta: [
      { title: "Speelhal — Brugklas-game Martinuscollege" },
      {
        name: "description",
        content: "Speel alle minigames uit de Brugklas-game opnieuw en verbeter je records.",
      },
    ],
  }),
  component: SpeelhalPagina,
});

function SpeelhalPagina() {
  const { state, dispatch } = useGame();
  const [actief, setActief] = useState<GameId | null>(null);
  const [res, setRes] = useState<{ r: MiniResult; record: boolean } | null>(null);
  const [ronde, setRonde] = useState(0);
  const game = ARCADE.find((g) => g.id === actief);

  if (game) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <SectionTitle icon={game.icon} title={game.naam} sub={game.uitleg} />
          <Pill tone="warn">🏆 {state.highscores[game.id] ?? 0}</Pill>
        </div>
        <Card>
          {res ? (
            <ResultaatKaart
              r={res.r}
              extra={
                res.record ? (
                  <p className="mt-3 animate-pop-in text-lg font-extrabold text-amber">
                    🏆 Nieuw record! +5 XP
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Record: {state.highscores[game.id] ?? 0} punten
                  </p>
                )
              }
              onOpnieuw={() => {
                setRes(null);
                setRonde((x) => x + 1);
              }}
              onVerder={() => {
                setRes(null);
                setActief(null);
              }}
              verderLabel="← Terug naar de speelhal"
            />
          ) : (
            <GameHost
              key={ronde}
              game={game.id}
              onKlaar={(r) => {
                const record = r.punten > (state.highscores[game.id] ?? 0);
                dispatch({ type: "SPEELHAL_SCORE", game: game.id, punten: r.punten });
                setRes({ r, record });
              }}
            />
          )}
        </Card>
        {!res ? (
          <BigButton variant="ghost" className="mt-4" onClick={() => setActief(null)}>
            ← Stoppen
          </BigButton>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <SectionTitle
        icon="🕹️"
        title="Speelhal"
        sub="Even pauze? Speel alle minigames uit de game opnieuw en jaag op records. Een nieuw record levert XP op!"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {ARCADE.map((g) => {
          const hs = state.highscores[g.id];
          return (
            <button
              key={g.id}
              onClick={() => {
                setActief(g.id);
                setRes(null);
              }}
              className={cn(
                "wiggle-hover flex items-center gap-4 rounded-3xl border-2 bg-card p-4 text-left shadow-sm transition-colors hover:border-brand",
                hs ? "border-mint/50" : "border-border",
              )}
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-3xl">
                {g.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{g.naam}</span>
                <span className="block text-xs text-muted-foreground">{g.uitleg}</span>
                <span className="mt-1 block text-xs font-bold text-amber">
                  {hs ? `🏆 Record: ${hs}` : "Nog niet gespeeld"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        🕹️ {state.gespeeld.length}/{ARCADE.length} spellen geprobeerd · speel er 5 voor de badge
        Speelhal-kampioen
      </p>
    </div>
  );
}
