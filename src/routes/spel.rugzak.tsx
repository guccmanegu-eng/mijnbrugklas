import { createFileRoute } from "@tanstack/react-router";
import { Card, Pill, SectionTitle } from "@/components/game/bits";
import { BACKPACK_ITEMS, SCHEDULE, SUBJECTS } from "@/lib/game/data";
import { useGame } from "@/lib/game/state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/spel/rugzak")({
  component: RugzakPagina,
});

function RugzakPagina() {
  const { state, dispatch } = useGame();
  // 's Avonds pak je alvast in voor morgen.
  const voorMorgen = state.phase === "avond" && state.currentDag + 1 < SCHEDULE.length;
  const vandaag = SCHEDULE[voorMorgen ? state.currentDag + 1 : state.currentDag] ?? [];
  const nodig = new Set(vandaag.map((l) => SUBJECTS[l.subject].item));
  // Tijdens de schooldag kun je niet meer naar huis om iets te halen.
  const dicht = state.phase === "les";

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle
        icon="🎒"
        title="Mijn rugzak"
        sub="Tik op een item om het in of uit je rugzak te doen. Vergeet niets voor de lessen van vandaag."
      />

      {dicht ? (
        <Card className="mb-4 border-amber/50 bg-amber/10 text-sm">
          <p className="font-bold">🔒 Je bent al op school</p>
          <p className="mt-1 text-muted-foreground">
            Wat je nu niet bij je hebt, ligt thuis. Na school kun je je rugzak weer inpakken — met
            het rooster van morgen ernaast.
          </p>
        </Card>
      ) : null}

      <Card className="mb-4">
        <p className="text-sm font-bold">
          {voorMorgen ? "Morgen heb je nodig" : "Vandaag heb je nodig"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[...nodig].map((item) => {
            const def = BACKPACK_ITEMS.find((b) => b.id === item)!;
            const heeft = state.backpack.includes(item);
            return (
              <Pill key={item} tone={heeft ? "good" : "bad"}>
                {heeft ? "✅" : "❌"} {def.icon} {def.naam}
              </Pill>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {BACKPACK_ITEMS.map((item) => {
          const inRugzak = state.backpack.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              disabled={dicht}
              aria-pressed={inRugzak}
              onClick={() => dispatch({ type: "TOGGLE_ITEM", item: item.id })}
              className={cn(
                "flex items-center gap-3 rounded-3xl border-2 p-4 text-left transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",
                inRugzak ? "border-brand bg-brand/8" : "border-border bg-card hover:bg-accent",
              )}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{item.naam}</span>
                <span className="block text-xs text-muted-foreground">
                  {inRugzak ? "In je rugzak" : "Ligt thuis"}
                </span>
              </span>
              {nodig.has(item.id) ? <Pill tone="warn">nodig</Pill> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
