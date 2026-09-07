import { createFileRoute, Link } from "@tanstack/react-router";
import { BigButton, Card, Pill, SectionTitle } from "@/components/game/bits";
import { ALL_ROOMS, SUBJECTS } from "@/lib/game/data";
import { fmtTijd, useGame, volgendeLes } from "@/lib/game/state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/spel/school")({
  component: SchoolPagina,
});

function SchoolPagina() {
  const { state, dispatch } = useGame();
  const les = volgendeLes(state);
  const vak = les ? SUBJECTS[les.subject] : null;
  const bezig = state.phase === "les" && !!les && !!vak;

  const opties = vak
    ? [vak.lokaal, ...["A2.21", "C0.04", "B0.08", "C1.03", "B1.12"].filter((r) => r !== vak.lokaal)]
        .slice(0, 3)
        .sort()
    : [];

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle icon="🗺️" title="De school" sub="Op het Martinuscollege lees je de code zo: A2.21 = vleugel A, tweede verdieping, lokaal 21." />

      {state.lastResult ? (
        <Card
          className={cn("mb-4", state.lastResult.goed ? "bg-mint/10" : "bg-rose/10")}
        >
          <p className="text-lg font-bold">
            {state.lastResult.goed
              ? `✅ Op tijd bij ${state.lastResult.vak}`
              : `❌ ${state.lastResult.telaat} minuten te laat bij ${state.lastResult.vak}`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {state.lastResult.goed
              ? `Je liep meteen naar lokaal ${state.lastResult.lokaal}. Netjes!`
              : `Het juiste lokaal was ${state.lastResult.lokaal}. Kijk eerst even op je rooster.`}
          </p>
          <p className="mt-2 text-sm font-semibold">
            {state.lastResult.itemOk
              ? `✅ Je had je ${state.lastResult.itemNaam} bij je.`
              : `❌ Je hebt je ${state.lastResult.itemNaam} niet bij je.`}
          </p>
          <BigButton className="mt-4" onClick={() => dispatch({ type: "CLEAR_RESULT" })}>
            Verder →
          </BigButton>
        </Card>
      ) : null}

      {bezig && vak && les ? (
        <Card className="mb-4">
          <p className="text-sm font-semibold text-muted-foreground">🕐 {fmtTijd(state.minuten)}</p>
          <h2 className="mt-1 text-xl font-bold">
            Je hebt nog {Math.max(0, les.minuten - state.minuten)} minuten
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Je volgende les is <strong>{vak.naam}</strong> in lokaal <strong>{vak.lokaal}</strong>. Je bent nu bij{" "}
            {state.currentLokaal}.
          </p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            {opties.map((lokaal) => (
              <button
                key={lokaal}
                onClick={() => dispatch({ type: "GA_NAAR_LOKAAL", keuze: lokaal })}
                className="rounded-2xl border-2 border-border px-4 py-3.5 text-sm font-bold transition-all hover:border-brand hover:bg-brand/5"
              >
                {state.currentLokaal} → {lokaal}
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="mb-4 text-sm text-muted-foreground">
          Er is nu geen les om naartoe te lopen. Bekijk rustig de plattegrond.
          <Link to="/spel" className="mt-3 block">
            <BigButton variant="soft">Terug naar dashboard</BigButton>
          </Link>
        </Card>
      )}

      <Card>
        <p className="text-sm font-extrabold">🧭 Plattegrond Martinuscollege · Grootebroek</p>
        <div className="mt-4 space-y-4">
          {(Object.keys(ALL_ROOMS) as (keyof typeof ALL_ROOMS)[]).map((gebouw) => (
            <div key={gebouw}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Vleugel {gebouw}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ALL_ROOMS[gebouw].map((lokaal) => (
                  <div
                    key={lokaal}
                    className={cn(
                      "wiggle-hover rounded-2xl border-2 py-4 text-center text-sm font-bold",
                      vak?.lokaal === lokaal
                        ? "border-brand bg-brand/10 text-brand"
                        : state.currentLokaal === lokaal
                          ? "border-amber bg-amber/12 text-amber"
                          : "border-border bg-secondary/50 text-muted-foreground",
                    )}
                  >
                    {lokaal}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill tone="brand">Doel-lokaal</Pill>
          <Pill tone="warn">Waar je nu bent</Pill>
        </div>
      </Card>
    </div>
  );
}
