import { createFileRoute } from "@tanstack/react-router";
import { Bar, Card, Pill, SectionTitle } from "@/components/game/bits";
import { BADGES, SKILL_META, type SkillId } from "@/lib/game/data";
import { gemiddeldeScore, useGame } from "@/lib/game/state";

export const Route = createFileRoute("/spel/vaardigheden")({
  component: VaardighedenPagina,
});

const UITLEG: Record<SkillId, string> = {
  planning: "Weet jij op tijd wanneer je wat doet?",
  tijdmanagement: "Ben je op tijd bij je lessen?",
  organisatie: "Heb je de juiste spullen bij je?",
  leren: "Bereid je je voor op toetsen en huiswerk?",
  zelfstandigheid: "Los je dingen zelf op als het spannend wordt?",
  verantwoordelijkheid: "Neem je verantwoordelijkheid voor je keuzes?",
};

export function SkillList() {
  const { state } = useGame();
  const keys = Object.keys(SKILL_META) as SkillId[];

  return (
    <div className="space-y-3">
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
            <p className="mt-2 text-xs text-muted-foreground">{UITLEG[k]}</p>
          </Card>
        );
      })}
    </div>
  );
}

function VaardighedenPagina() {
  const { state } = useGame();

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle
        icon="⭐"
        title="Jouw vaardigheden"
        sub="Elke keuze die je maakt verandert deze scores een beetje."
      />

      <Card className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Gemiddelde score</p>
            <p className="text-3xl font-bold">{gemiddeldeScore(state.skills)}%</p>
          </div>
          <Pill tone="brand">⭐ {state.xp} XP</Pill>
        </div>
        <Bar value={gemiddeldeScore(state.skills)} className="mt-3" />
      </Card>

      <SkillList />

      <Card className="mt-4">
        <p className="text-sm font-bold">🏅 Badges</p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {Object.entries(BADGES).map(([id, badge]) => {
            const behaald = state.badges.includes(id);
            return (
              <div
                key={id}
                className={`rounded-2xl border-2 p-3 ${behaald ? "border-mint bg-mint/8" : "border-border opacity-60"}`}
              >
                <p className="text-sm font-bold">
                  {badge.icon} {badge.naam}
                </p>
                <p className="text-xs text-muted-foreground">{badge.uitleg}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
