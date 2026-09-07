import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BigButton, Card, Pill } from "@/components/game/bits";
import { fmtTijd, useGame, volgendeLes, gemiddeldeScore } from "@/lib/game/state";
import { DAY_DATES, DAY_NAMES, HOMEWORK, SCHEDULE, SUBJECTS } from "@/lib/game/data";

export const Route = createFileRoute("/spel/")({
  component: Dashboard,
});

function Dashboard() {
  const { state, dispatch } = useGame();
  const les = volgendeLes(state);
  const vak = les ? SUBJECTS[les.subject] : null;
  const afgerond = state.homework.filter((h) => h.completedDag !== null).length;
  const openDeadlines = HOMEWORK.filter((d) =>
    state.homework.some((h) => h.id === d.id && h.completedDag === null),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 pt-1">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand">🎒 Brugklas</p>
          <h1 className="truncate text-2xl font-bold">
            {DAY_NAMES[state.currentDag]} {DAY_DATES[state.currentDag]}
          </h1>
        </div>
        <Pill tone="brand">Dag {state.currentDag + 1} / 5</Pill>
      </header>

      <Card>
        <p className="text-sm font-semibold text-muted-foreground">🕐 {fmtTijd(state.minuten)}</p>

        {state.phase === "ochtend" ? (
          <>
            <h2 className="mt-2 text-xl font-bold">Klaar om te beginnen?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pak eerst je rugzak in met de spullen die je vandaag nodig hebt. Vandaag heb je:{" "}
              {[...new Set((SCHEDULE[state.currentDag] ?? []).map((l) => SUBJECTS[l.subject].naam))].join(", ")}.
            </p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <Link to="/spel/rugzak">
                <BigButton variant="soft">🎒 Rugzak inpakken</BigButton>
              </Link>
              <BigButton onClick={() => dispatch({ type: "START_DAG" })}>Start schooldag →</BigButton>
            </div>
          </>
        ) : null}

        {state.phase === "les" && les && vak ? (
          <>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Volgende les</p>
            <h2 className="mt-1 text-2xl font-bold">
              {vak.icon} {vak.naam}
            </h2>
            <p className="text-sm text-muted-foreground">
              Lokaal {vak.lokaal} · begint om {les.tijd}
            </p>
            <p className="mt-1 text-sm font-semibold text-brand">
              {les.minuten > state.minuten
                ? `Begint over ${les.minuten - state.minuten} minuten`
                : "De les is al begonnen — schiet op!"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Je bent nu bij {state.currentLokaal}.</p>
            <Link to="/spel/school" className="mt-4 block">
              <BigButton>Naar lokaal {vak.lokaal} →</BigButton>
            </Link>
          </>
        ) : null}

        {state.phase === "avond" ? (
          <>
            <h2 className="mt-2 text-xl font-bold">🌙 De schooldag zit erop</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nu is het jouw tijd. Maak huiswerk, plan je taken of leer alvast voor de toets van vrijdag.
            </p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <Link to="/spel/huiswerk">
                <BigButton variant="soft">📚 Huiswerk maken</BigButton>
              </Link>
              <Link to="/spel/planning">
                <BigButton variant="soft">📅 Planning maken</BigButton>
              </Link>
              <BigButton
                variant="ghost"
                disabled={state.geleerdOpDagen.includes(state.currentDag)}
                onClick={() => dispatch({ type: "LEREN" })}
              >
                {state.geleerdOpDagen.includes(state.currentDag) ? "🧠 Al geleerd vandaag" : "🧠 Leren voor de toets"}
              </BigButton>
              <BigButton onClick={() => dispatch({ type: "VOLGENDE_DAG" })}>Naar morgen →</BigButton>
            </div>
          </>
        ) : null}

        {state.phase === "toets" ? (
          <>
            <h2 className="mt-2 text-xl font-bold">📝 Tijd voor de toets</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Het is vrijdagmiddag. Je toets gaat over alles van deze week.
            </p>
            <Link to="/spel/toets" className="mt-4 block">
              <BigButton>Start de toets →</BigButton>
            </Link>
          </>
        ) : null}

        {state.phase === "klaar" ? (
          <>
            <h2 className="mt-2 text-xl font-bold">🎉 Je week zit erop!</h2>
            <Link to="/spel/rapport" className="mt-4 block">
              <BigButton>Bekijk je eindrapport →</BigButton>
            </Link>
          </>
        ) : null}
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/spel/huiswerk">
          <Card className="h-full transition-transform hover:-translate-y-0.5">
            <p className="text-sm font-semibold">📚 Huiswerk</p>
            <p className="mt-1 text-2xl font-bold">
              {afgerond} / {state.homework.length}
            </p>
            <p className="text-xs text-muted-foreground">opdrachten af</p>
          </Card>
        </Link>
        <Link to="/spel/planning">
          <Card className="h-full transition-transform hover:-translate-y-0.5">
            <p className="text-sm font-semibold">📅 Planning</p>
            <p className="mt-1 text-2xl font-bold">
              {state.homework.filter((h) => h.plannedDag !== null).length} ingepland
            </p>
            <p className="text-xs text-muted-foreground">Bekijk planning</p>
          </Card>
        </Link>
        <Link to="/spel/rugzak">
          <Card className="h-full transition-transform hover:-translate-y-0.5">
            <p className="text-sm font-semibold">🎒 Rugzak</p>
            <p className="mt-1 text-2xl font-bold">{state.backpack.length} items</p>
            <p className="text-xs text-muted-foreground">Bekijk je spullen</p>
          </Card>
        </Link>
        <Link to="/spel/vaardigheden">
          <Card className="h-full transition-transform hover:-translate-y-0.5">
            <p className="text-sm font-semibold">⭐ Vaardigheden</p>
            <p className="mt-1 text-2xl font-bold">{gemiddeldeScore(state.skills)}%</p>
            <Bar value={gemiddeldeScore(state.skills)} className="mt-2" />
          </Card>
        </Link>
      </div>

      {openDeadlines.length > 0 ? (
        <Card>
          <p className="text-sm font-bold">⏳ Deadlines die eraan komen</p>
          <ul className="mt-3 space-y-2">
            {openDeadlines.map((d) => {
              const dagenOver = d.deadlineDag - state.currentDag;
              return (
                <li key={d.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    {SUBJECTS[d.subject].icon} {SUBJECTS[d.subject].naam} — {d.titel}
                  </span>
                  <Pill tone={dagenOver < 0 ? "bad" : dagenOver === 0 ? "warn" : "muted"}>
                    {dagenOver < 0
                      ? "Te laat"
                      : dagenOver === 0
                        ? "Vandaag"
                        : dagenOver === 1
                          ? "Morgen"
                          : DAY_NAMES[d.deadlineDag]}
                  </Pill>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
