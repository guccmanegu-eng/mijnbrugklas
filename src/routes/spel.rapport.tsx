import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bar, BigButton, Card, Pill, SectionTitle } from "@/components/game/bits";
import { BADGES, DAY_NAMES, HOMEWORK, SKILL_META, SUBJECTS, type SkillId } from "@/lib/game/data";
import { clearSave, gemiddeldeScore, useGame } from "@/lib/game/state";

export const Route = createFileRoute("/spel/rapport")({
  component: RapportPagina,
});

const TIPS: Record<SkillId, string> = {
  planning: "Schrijf huiswerk meteen in je agenda op de dag dat je het gaat maken, niet op de deadline.",
  tijdmanagement: "Kijk in de pauze alvast waar je volgende lokaal is, dan hoef je niet te rennen.",
  organisatie: "Pak 's avonds je rugzak in met het rooster van morgen ernaast.",
  leren: "Leer liever drie keer twintig minuten dan één keer een uur.",
  zelfstandigheid: "Steek je hand op als je iets niet snapt — dat is precies waar docenten voor zijn.",
  verantwoordelijkheid: "Ging er iets mis? Vertel het eerlijk en maak een nieuwe afspraak.",
};

function RapportPagina() {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  const keys = Object.keys(SKILL_META) as SkillId[];
  const gemiddelde = gemiddeldeScore(state.skills);
  const sterkste = keys.reduce((a, b) => (state.skills[a] >= state.skills[b] ? a : b));
  const zwakste = keys.reduce((a, b) => (state.skills[a] <= state.skills[b] ? a : b));
  const afgerond = state.homework.filter((h) => h.completedDag !== null).length;
  const lessen = state.lessenOpTijd + state.lessenTeLaat;

  if (state.phase !== "klaar") {
    return (
      <Card className="mx-auto max-w-2xl text-sm text-muted-foreground">
        Je rapport komt aan het einde van de week, na de toets.
        <Link to="/spel" className="mt-3 block">
          <BigButton variant="soft">Terug naar het dashboard</BigButton>
        </Link>
      </Card>
    );
  }

  const opnieuw = () => {
    clearSave();
    dispatch({ type: "RESET" });
    navigate({ to: "/profiel" });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle
        icon="🎓"
        title={`Het rapport van ${state.playerName}`}
        sub="Je eerste week in de brugklas zit erop. Dit heb je laten zien."
      />

      <Card className="text-center">
        <p className="text-5xl">{gemiddelde >= 75 ? "🌟" : gemiddelde >= 60 ? "👍" : "💪"}</p>
        <h2 className="mt-3 text-3xl font-bold">{gemiddelde}%</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {gemiddelde >= 75
            ? "Je bent klaar voor de middelbare school."
            : gemiddelde >= 60
              ? "Je komt een heel eind. Nog een paar gewoontes en je bent er."
              : "Deze week was pittig — en dat is precies waarom je hier oefent."}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Pill tone="brand">⭐ {state.xp} XP</Pill>
          <Pill tone="good">⏰ {state.lessenOpTijd}/{lessen} lessen op tijd</Pill>
          <Pill tone="muted">📚 {afgerond}/{state.homework.length} huiswerk af</Pill>
          {state.testScore ? (
            <Pill tone={state.testScore.correct / state.testScore.totaal >= 0.6 ? "good" : "warn"}>
              📝 Toets {state.testScore.correct}/{state.testScore.totaal}
            </Pill>
          ) : null}
        </div>
      </Card>

      <div className="mt-4 space-y-3">
        {keys.map((k) => {
          const meta = SKILL_META[k];
          const waarde = state.skills[k];
          return (
            <Card key={k}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold">
                  {meta.icon} {meta.naam}
                </p>
                <Pill tone={waarde >= 75 ? "good" : waarde >= 55 ? "warn" : "bad"}>{waarde}%</Pill>
              </div>
              <Bar value={waarde} className={`mt-3 ${meta.kleur}`} />
            </Card>
          );
        })}
      </div>

      <Card className="mt-4">
        <p className="text-sm font-bold">💡 Wat gaat al goed</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {SKILL_META[sterkste].icon} {SKILL_META[sterkste].naam} is je sterkste punt ({state.skills[sterkste]}%).
        </p>
        <p className="mt-4 text-sm font-bold">🎯 Wat je nog kunt oefenen</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {SKILL_META[zwakste].icon} {SKILL_META[zwakste].naam} ({state.skills[zwakste]}%). {TIPS[zwakste]}
        </p>
      </Card>

      <Card className="mt-4">
        <p className="text-sm font-bold">🏅 Badges deze week</p>
        {state.badges.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nog geen badges — probeer het volgende week nog eens.
          </p>
        ) : (
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {state.badges.map((id) => (
              <div key={id} className="rounded-2xl border-2 border-mint bg-mint/8 p-3">
                <p className="text-sm font-bold">
                  {BADGES[id]?.icon} {BADGES[id]?.naam}
                </p>
                <p className="text-xs text-muted-foreground">{BADGES[id]?.uitleg}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <p className="text-sm font-bold">📖 Je huiswerk van deze week</p>
        <ul className="mt-3 space-y-2 text-sm">
          {state.homework.map((hw) => {
            const def = HOMEWORK.find((d) => d.id === hw.id)!;
            return (
              <li key={hw.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">
                  {SUBJECTS[def.subject].icon} {def.titel}
                </span>
                <Pill tone={hw.completedDag !== null ? "good" : "bad"}>
                  {hw.completedDag !== null ? DAY_NAMES[hw.completedDag] : "Niet gemaakt"}
                </Pill>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link to="/spel/voortgang">
          <BigButton variant="soft">📊 Bekijk je hele week</BigButton>
        </Link>
        <BigButton onClick={opnieuw}>Nog een week oefenen →</BigButton>
      </div>
    </div>
  );
}
