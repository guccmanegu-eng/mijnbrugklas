import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BigButton, Card, Pill, SectionTitle } from "@/components/game/bits";
import { DAY_NAMES, HOMEWORK, SUBJECTS } from "@/lib/game/data";
import { useGame } from "@/lib/game/state";

export const Route = createFileRoute("/spel/huiswerk/")({
  component: HuiswerkPagina,
});

function HuiswerkPagina() {
  const { state } = useGame();

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle icon="📚" title="Mijn huiswerk" sub="Jij bepaalt zelf wanneer je wat maakt." />

      {state.homework.length === 0 ? (
        <Card className="text-sm text-muted-foreground">Je hebt nog geen huiswerk gekregen.</Card>
      ) : null}

      <div className="space-y-3">
        {state.homework.map((hw) => {
          const def = HOMEWORK.find((d) => d.id === hw.id)!;
          const vak = SUBJECTS[def.subject];
          const dagenOver = def.deadlineDag - state.currentDag;
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
                <Pill tone={klaar ? "good" : dagenOver < 0 ? "bad" : dagenOver <= 1 ? "warn" : "muted"}>
                  {klaar
                    ? "Af ✅"
                    : dagenOver < 0
                      ? "Deadline gemist"
                      : dagenOver === 0
                        ? "Vandaag inleveren"
                        : dagenOver === 1
                          ? "Morgen"
                          : DAY_NAMES[def.deadlineDag]}
                </Pill>
              </div>

              <div className="mt-4">
                <Bar
                  value={klaar ? 100 : hw.progress}
                  className={klaar ? "bg-mint" : undefined}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {klaar
                    ? `Gemaakt op ${DAY_NAMES[hw.completedDag!]} — ${hw.correct}/${hw.totaal} goed`
                    : hw.plannedDag !== null
                      ? `Ingepland voor ${DAY_NAMES[hw.plannedDag]}`
                      : "Nog niet ingepland"}
                </p>
              </div>

              {!klaar ? (
                <Link to="/spel/huiswerk/$id" params={{ id: hw.id }} className="mt-4 block">
                  <BigButton>Maak huiswerk →</BigButton>
                </Link>
              ) : null}
            </Card>
          );
        })}
      </div>

      <Link to="/spel/planning" className="mt-4 block">
        <BigButton variant="soft">📅 Naar mijn planning</BigButton>
      </Link>
    </div>
  );
}
