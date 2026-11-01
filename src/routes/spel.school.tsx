import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BigButton, Card, Pill, SectionTitle } from "@/components/game/bits";
import { SchoolMapGame } from "@/components/game/SchoolMap";
import { ALL_ROOMS, SUBJECTS } from "@/lib/game/data";
import { doelLokaal, fmtTijd, useGame, volgendeLes } from "@/lib/game/state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/spel/school")({
  head: () => ({
    meta: [
      { title: "De school — Brugklas-game Martinuscollege" },
      {
        name: "description",
        content:
          "Loop met WASD of de pijltjestoetsen door de gangen van het Martinuscollege en vind het juiste lokaal voordat de les begint.",
      },
      { property: "og:title", content: "De school — vind je lokaal in de Brugklas-game" },
      {
        property: "og:description",
        content: "Wandel door de plattegrond van het Martinuscollege Grootebroek en wees op tijd bij je les.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchoolPagina,
});

function SchoolPagina() {
  const { state, dispatch } = useGame();
  const les = volgendeLes(state);
  const vak = les ? SUBJECTS[les.subject] : null;
  const bezig = state.phase === "les" && !!les && !!vak;
  const lesKey = `${state.currentDag}-${state.lessonIndex}`;
  const [gekeken, setGekeken] = useState("");
  const gewijzigd = doelLokaal(state);
  const gezien = !!gewijzigd && !!state.wijziging?.gecheckt;
  // Wat de speler dénkt dat het lokaal is: pas na de roosterpaal zie je de wijziging
  const zichtbaarLokaal = gezien ? gewijzigd! : (vak?.lokaal ?? "");

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
          {state.lastResult.goed && (state.streak ?? 0) >= 2 ? (
            <p className="mt-2 text-sm font-bold text-amber">
              ⚡ {state.streak}× op rij op tijd!{state.streak >= 3 ? ` +${state.streak * 2} bonus-XP` : " Nog één voor bonus-XP!"}
            </p>
          ) : null}
          <BigButton className="mt-4" onClick={() => dispatch({ type: "CLEAR_RESULT" })}>
            Verder →
          </BigButton>
        </Card>
      ) : null}

      {bezig && vak && les && !state.lastResult ? (
        <Card className="mb-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-muted-foreground">🕐 {fmtTijd(state.minuten)}</p>
            <Pill tone="warn">Nog {Math.max(0, les.minuten - state.minuten)} minuten</Pill>
          </div>
          <h2 className="text-xl font-bold">Loop naar {vak.naam}!</h2>
          <div className="mt-3 rounded-2xl border-2 border-dashed border-brand/40 bg-brand/5 p-3 text-sm">
            {gezien ? (
              <p className="font-bold text-rose">
                🪧 Roosterwijziging! {vak.naam} is verplaatst van {vak.lokaal} naar {gewijzigd}.
              </p>
            ) : gekeken === lesKey ? (
              <p className="font-semibold text-mint">🪧 Roosterpaal: geen wijziging voor deze les. Gewoon naar {vak.lokaal}!</p>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground">🪧 Telefoon zit in je kluisje. Even de roosterpaal in de hal checken?</p>
                <BigButton
                  variant="soft"
                  className="w-auto px-4 py-2"
                  onClick={() => {
                    dispatch({ type: "CHECK_ROOSTERPAAL" });
                    setGekeken(lesKey);
                  }}
                >
                  Check roosterpaal
                </BigButton>
              </div>
            )}
          </div>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Je bent nu bij <strong>{state.currentLokaal}</strong>. Zoek lokaal <strong>{zichtbaarLokaal}</strong> — maar
            pas op: het verkeerde lokaal binnenlopen kost je tijd!
          </p>
          <SchoolMapGame
            key={`${state.currentDag}-${state.lessonIndex}`}
            target={zichtbaarLokaal}
            vakNaam={vak.naam}
            vakIcon={vak.icon}
            minutenOver={les.minuten - state.minuten}
            startLokaal={state.currentLokaal}
            onStar={() => dispatch({ type: "STAR" })}
            onArrive={(lokaal) => dispatch({ type: "GA_NAAR_LOKAAL", keuze: lokaal })}
          />
        </Card>
      ) : !bezig ? (
        <Card className="mb-4 text-sm text-muted-foreground">
          Er is nu geen les om naartoe te lopen. Bekijk rustig de plattegrond.
          <Link to="/spel" className="mt-3 block">
            <BigButton variant="soft">Terug naar dashboard</BigButton>
          </Link>
        </Card>
      ) : null}

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
                      bezig && zichtbaarLokaal === lokaal
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
