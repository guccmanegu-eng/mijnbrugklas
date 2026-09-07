import { createFileRoute } from "@tanstack/react-router";
import { Bar, Card, Pill, SectionTitle } from "@/components/game/bits";
import { DAY_NAMES, HOMEWORK, SUBJECTS } from "@/lib/game/data";
import { gemiddeldeScore, useGame } from "@/lib/game/state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/spel/voortgang")({
  component: VoortgangPagina,
});

function VoortgangPagina() {
  const { state } = useGame();
  const lessen = state.lessenOpTijd + state.lessenTeLaat;
  const opTijdPct = lessen === 0 ? 0 : Math.round((state.lessenOpTijd / lessen) * 100);
  const afgerond = state.homework.filter((h) => h.completedDag !== null).length;

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle icon="📊" title="Mijn voortgang" sub="Alles wat je deze week hebt gedaan." />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-sm font-semibold">⏰ Op tijd in de les</p>
          <p className="mt-1 text-2xl font-bold">{opTijdPct}%</p>
          <Bar value={opTijdPct} className="mt-2 bg-mint" />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {state.lessenOpTijd} op tijd · {state.lessenTeLaat} te laat
          </p>
        </Card>
        <Card>
          <p className="text-sm font-semibold">📚 Huiswerk af</p>
          <p className="mt-1 text-2xl font-bold">
            {afgerond} / {state.homework.length}
          </p>
          <Bar
            value={state.homework.length === 0 ? 0 : (afgerond / state.homework.length) * 100}
            className="mt-2"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {state.homework.filter((h) => h.plannedDag !== null).length} taken ingepland
          </p>
        </Card>
        <Card>
          <p className="text-sm font-semibold">🎒 Spullen vergeten</p>
          <p className="mt-1 text-2xl font-bold">{state.vergetenItems}×</p>
          <p className="mt-1.5 text-xs text-muted-foreground">Bij hoeveel lessen je iets miste</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold">⭐ Gemiddelde vaardigheden</p>
          <p className="mt-1 text-2xl font-bold">{gemiddeldeScore(state.skills)}%</p>
          <Bar value={gemiddeldeScore(state.skills)} className="mt-2" />
        </Card>
      </div>

      <Card className="mt-4">
        <p className="text-sm font-bold">📌 Deadlines</p>
        <ul className="mt-3 space-y-2 text-sm">
          {state.homework.map((hw) => {
            const def = HOMEWORK.find((d) => d.id === hw.id)!;
            const klaar = hw.completedDag !== null;
            const teLaat = !klaar && def.deadlineDag < state.currentDag;
            return (
              <li key={hw.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">
                  {SUBJECTS[def.subject].icon} {def.titel}
                </span>
                <Pill tone={klaar ? "good" : teLaat ? "bad" : "muted"}>
                  {klaar ? `Af (${DAY_NAMES[hw.completedDag!]})` : teLaat ? "Gemist" : DAY_NAMES[def.deadlineDag]}
                </Pill>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="mt-4">
        <p className="text-sm font-bold">🕒 Wat er gebeurde</p>
        {state.log.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nog niets gebeurd.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {[...state.log]
              .slice()
              .reverse()
              .map((entry, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      entry.type === "goed" ? "bg-mint" : entry.type === "slecht" ? "bg-rose" : "bg-border",
                    )}
                  />
                  <span className="min-w-0">
                    <span className="text-muted-foreground">{DAY_NAMES[entry.dag]}: </span>
                    {entry.tekst}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
