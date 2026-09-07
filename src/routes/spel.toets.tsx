import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BigButton, Card, SectionTitle } from "@/components/game/bits";
import { Quiz } from "@/components/game/Quiz";
import { TEST_QUESTIONS } from "@/lib/game/data";
import { useGame } from "@/lib/game/state";

export const Route = createFileRoute("/spel/toets")({
  component: ToetsPagina,
});

function ToetsPagina() {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();

  if (state.testScore) {
    const { correct, totaal } = state.testScore;
    return (
      <div className="mx-auto max-w-2xl">
        <SectionTitle icon="📝" title="Je toets is nagekeken" />
        <Card className="text-center">
          <p className="text-5xl">{correct / totaal >= 0.6 ? "🎉" : "💪"}</p>
          <h2 className="mt-3 text-3xl font-bold">
            {correct} / {totaal}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {correct / totaal >= 0.6
              ? "Je voorbereiding heeft geholpen. Zo werkt leren op de middelbare school."
              : "Deze ging nog niet lekker. In het echt helpt het om eerder te beginnen met leren."}
          </p>
          <Link to="/spel/rapport" className="mt-5 block">
            <BigButton>Bekijk je eindrapport →</BigButton>
          </Link>
        </Card>
      </div>
    );
  }

  if (state.phase !== "toets") {
    return (
      <Card className="mx-auto max-w-2xl text-sm text-muted-foreground">
        De toets is pas op vrijdag, na je laatste les.
        <Link to="/spel" className="mt-3 block">
          <BigButton variant="soft">Terug naar het dashboard</BigButton>
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle
        icon="📝"
        title="Toets van de week"
        sub={`10 vragen over alle vakken. Je hebt ${state.geleerdOpDagen.length} dag(en) geleerd.`}
      />
      <Quiz
        vragen={TEST_QUESTIONS}
        intro="Rustig lezen, dan antwoorden. Er is hier geen echte onvoldoende — wel echte feedback."
        onKlaar={(correct, totaal) => {
          dispatch({ type: "TOETS_KLAAR", correct, totaal });
          navigate({ to: "/spel/rapport" });
        }}
      />
    </div>
  );
}
