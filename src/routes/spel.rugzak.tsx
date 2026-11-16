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
  const vandaag = SCHEDULE[state.currentDag] ?? [];
  const nodig = new Set(vandaag.map((l) => SUBJECTS[l.subject].item));

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle
        icon="🎒"
        title="Mijn rugzak"
        sub="Tik op een item om het in of uit je rugzak te doen. Vergeet niets voor de lessen van vandaag."
      />

      <Card className="mb-4">
        <p className="text-sm font-bold">Vandaag heb je nodig</p>
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
              onClick={() => dispatch({ type: "TOGGLE_ITEM", item: item.id })}
              className={cn(
                "flex items-center gap-3 rounded-3xl border-2 p-4 text-left transition-all active:scale-[0.99]",
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
