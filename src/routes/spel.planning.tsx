import { createFileRoute } from "@tanstack/react-router";
import { BigButton, Card, Pill, SectionTitle } from "@/components/game/bits";
import { DAY_NAMES, HOMEWORK, SCHEDULE, SUBJECTS } from "@/lib/game/data";
import { useGame } from "@/lib/game/state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/spel/planning")({
  component: PlanningPagina,
});

function PlanningPagina() {
  const { state, dispatch } = useGame();
  const geleerd = state.geleerdOpDagen.includes(state.currentDag);
  const kanLeren = state.phase === "avond" || state.phase === "ochtend";

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle
        icon="📅"
        title="Mijn planning"
        sub="Kies zelf op welke dag je iets maakt. Niemand zegt het je — jij beslist."
      />

      <div className="space-y-3">
        {state.homework.map((hw) => {
          const def = HOMEWORK.find((d) => d.id === hw.id)!;
          const vak = SUBJECTS[def.subject];
          const klaar = hw.completedDag !== null;
          return (
            <Card key={hw.id}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold">
                    {vak.icon} {vak.naam}
                  </p>
                  <p className="text-sm text-muted-foreground">{def.titel}</p>
                </div>
                <Pill tone={klaar ? "good" : def.deadlineDag < state.currentDag ? "bad" : "muted"}>
                  Uiterlijk {DAY_NAMES[def.deadlineDag]}
                </Pill>
              </div>

              {klaar ? (
                <p className="mt-4 text-sm text-mint">
                  ✅ Gemaakt op {DAY_NAMES[hw.completedDag!]} — {hw.correct}/{hw.totaal} goed
                </p>
              ) : (
                <>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Wanneer maak je dit?
                  </p>
                  <div className="mt-2 grid grid-cols-5 gap-1.5">
                    {DAY_NAMES.map((dag, i) => {
                      const verleden = i < state.currentDag;
                      const gekozen = hw.plannedDag === i;
                      return (
                        <button
                          key={dag}
                          disabled={verleden}
                          onClick={() =>
                            dispatch({ type: "PLAN_HUISWERK", id: hw.id, dag: gekozen ? null : i })
                          }
                          className={cn(
                            "rounded-2xl border-2 px-1 py-2.5 text-xs font-semibold transition-all disabled:opacity-35",
                            gekozen
                              ? "border-brand bg-brand/10 text-brand"
                              : "border-border hover:bg-accent",
                          )}
                        >
                          {dag.slice(0, 2)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {hw.plannedDag === null
                      ? "Nog niet ingepland — dat telt mee voor je planningsscore."
                      : hw.plannedDag <= def.deadlineDag
                        ? `Ingepland voor ${DAY_NAMES[hw.plannedDag]}, mooi op tijd.`
                        : `Let op: ${DAY_NAMES[hw.plannedDag]} is ná de deadline.`}
                  </p>
                </>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-4">
        <p className="text-sm font-bold">🧠 Leren voor de toets</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Vrijdag heb je een toets over de hele week. Je kunt elke dag één keer leren.
        </p>
        <BigButton
          className="mt-4"
          variant={geleerd ? "soft" : "primary"}
          disabled={geleerd || !kanLeren}
          onClick={() => dispatch({ type: "LEREN" })}
        >
          {geleerd ? "Vandaag al geleerd ✅" : "Een half uur leren"}
        </BigButton>
        <p className="mt-2 text-xs text-muted-foreground">
          Al {state.geleerdOpDagen.length} dag(en) geleerd deze week.
        </p>
      </Card>

      <Card className="mt-4">
        <p className="text-sm font-bold">🗓️ Je week in het kort</p>
        <div className="mt-3 space-y-2">
          {DAY_NAMES.map((dag, i) => (
            <div key={dag} className="flex items-center justify-between gap-3 text-sm">
              <span className={cn("font-semibold", i === state.currentDag && "text-brand")}>{dag}</span>
              <span className="min-w-0 truncate text-right text-xs text-muted-foreground">
                {(SCHEDULE[i] ?? []).length} lessen ·{" "}
                {state.homework.filter((h) => h.plannedDag === i).length} taken gepland
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
