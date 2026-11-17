import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LIVE_EVENTS, levelInfo, sterren } from "@/lib/game/events";
import { Bar, BigButton, Card, Pill } from "@/components/game/bits";
import { doelLokaal, fmtTijd, useGame, volgendeLes, gemiddeldeScore } from "@/lib/game/state";
import { BACKPACK_ITEMS, DAY_DATES, DAY_NAMES, HOMEWORK, SCHEDULE, SUBJECTS } from "@/lib/game/data";

export const Route = createFileRoute("/spel/")({
  component: Dashboard,
});

function Dashboard() {
  const { state, dispatch } = useGame();
  const les = volgendeLes(state);
  const vak = les ? SUBJECTS[les.subject] : null;
  // Na het checken van de roosterpaal weet je het nieuwe lokaal; daarvoor niet.
  const gewijzigd = doelLokaal(state);
  const lokaal = gewijzigd && state.wijziging?.gecheckt ? gewijzigd : vak?.lokaal;
  const nodigVandaag = [...new Set((SCHEDULE[state.currentDag] ?? []).map((l) => SUBJECTS[l.subject].item))];
  const aantalMist = nodigVandaag.filter((i) => !state.backpack.includes(i)).length;
  const aantalTeVeel = state.backpack.filter(
    (i) => !nodigVandaag.includes(i) && BACKPACK_ITEMS.some((b) => b.id === i && b.id !== "etui"),
  ).length;
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

      <Omroep />

      <Card>
        <p className="text-sm font-semibold text-muted-foreground">🕐 {fmtTijd(state.minuten)}</p>

        {state.phase === "ochtend" ? (
          <>
            <h2 className="mt-2 text-xl font-bold">Klaar om te beginnen?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pak eerst je rugzak in met de spullen die je vandaag nodig hebt. Vandaag heb je:{" "}
              {[...new Set((SCHEDULE[state.currentDag] ?? []).map((l) => SUBJECTS[l.subject].naam))].join(", ")}.
            </p>
            {state.backpack.length > 0 ? (
              <p className="mt-2 text-sm font-semibold" aria-live="polite">
                {aantalMist === 0 ? (
                  <span className="text-mint">✅ Je rugzak lijkt compleet{aantalTeVeel ? ` (wel ${aantalTeVeel} boek(en) te veel mee)` : ""}.</span>
                ) : (
                  <span className="text-amber">⚠️ Check je rugzak nog even: er mist iets voor vandaag.</span>
                )}
              </p>
            ) : (
              <p className="mt-2 text-sm font-semibold text-amber">⚠️ Je rugzak is nog leeg!</p>
            )}
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
              Lokaal {lokaal}
              {lokaal !== vak.lokaal ? " (roosterwijziging!)" : ""} · begint om {les.tijd} · les{" "}
              {state.lessonIndex + 1} van{" "}
              {SCHEDULE[state.currentDag]?.length ?? 0}
            </p>
            {state.streak >= 2 ? (
              <p className="mt-1 text-sm font-bold text-amber">⚡ {state.streak}× op rij op tijd — houd het vol!</p>
            ) : null}
            <p className="mt-1 text-sm font-semibold text-brand">
              {les.minuten > state.minuten
                ? `Begint over ${les.minuten - state.minuten} minuten`
                : "De les is al begonnen — schiet op!"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Je bent nu bij {state.currentLokaal}.</p>
            <Link to="/spel/school" className="mt-4 block">
              <BigButton>Naar lokaal {lokaal} →</BigButton>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">📢 Live events</p>
            <Pill tone="muted">
              {new Set(state.eventsGedaan.map((e) => e.id)).size}/{LIVE_EVENTS.length}
            </Pill>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {LIVE_EVENTS.map((ev) => {
              const r = state.eventsGedaan.find((x) => x.id === ev.id);
              return (
                <span
                  key={ev.id}
                  title={r ? `${ev.titel}: ${"⭐".repeat(sterren(r.score))}` : "Nog niet gebeurd…"}
                  className={
                    r
                      ? "flex h-10 w-10 items-center justify-center rounded-xl bg-mint/12 text-xl"
                      : "flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-xl opacity-50 grayscale"
                  }
                >
                  {r ? ev.icon : "❔"}
                </span>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Op school kan van alles gebeuren. Blijf alert!</p>
        </Card>
        <Link to="/spel/speelhal">
          <Card className="h-full bg-confetti transition-transform hover:-translate-y-0.5">
            <p className="text-sm font-semibold">🕹️ Speelhal</p>
            <p className="mt-1 text-2xl font-bold">
              {Object.keys(state.highscores).length} records
            </p>
            <p className="text-xs text-muted-foreground">Speel alle minigames opnieuw · level {levelInfo(state.xp).level}</p>
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

const OMROEP = [
  "📢 De kantine heeft vandaag verse tosti's. Op = op!",
  "📢 Gevonden voorwerpen: één blauwe gymschoen, maat 38. Melden bij de conciërge.",
  "📢 Herinnering: telefoons blijven in je kluisje tot 15:30.",
  "📢 Vanmiddag training voor het pauzetoernooi op het schoolplein.",
  "📢 Check de roosterpalen in de hal in elke pauze!",
  "📢 De mediatheek is open in het tussenuur. Stil werken graag.",
  "📢 Fietsen in de stalling, niet tegen het hek. Dank je wel!",
  "📢 Brugklassers: vergeet je agenda niet in te vullen.",
  "📢 Er is een oefening met het brandalarm gepland… of toch niet?",
  "📢 Het winnende team van de rekenrace krijgt een taart van de sectie wiskunde.",
];

function Omroep() {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(Math.floor(Math.random() * OMROEP.length));
    const id = window.setInterval(() => setI((x) => (x + 1) % OMROEP.length), 7000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="overflow-hidden rounded-2xl border border-amber/40 bg-amber/10 px-4 py-2.5 text-sm font-semibold">
      <p key={i} className="animate-pop-in truncate">
        {OMROEP[i]}
      </p>
    </div>
  );
}
