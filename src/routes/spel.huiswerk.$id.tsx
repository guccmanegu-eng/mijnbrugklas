import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BigButton, Card, SectionTitle } from "@/components/game/bits";
import { Quiz } from "@/components/game/Quiz";
import { EXERCISES, HOMEWORK, SUBJECTS } from "@/lib/game/data";
import { useGame } from "@/lib/game/state";

export const Route = createFileRoute("/spel/huiswerk/$id")({
  component: OpdrachtPagina,
});

function OpdrachtPagina() {
  const { id } = Route.useParams();
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  const [resultaat, setResultaat] = useState<{ correct: number; totaal: number } | null>(null);

  const def = HOMEWORK.find((h) => h.id === id);
  const oefening = EXERCISES[id];

  if (!def || !oefening) {
    return (
      <Card className="mx-auto max-w-2xl text-sm text-muted-foreground">
        Deze opdracht bestaat niet.
        <Link to="/spel/huiswerk" className="mt-3 block">
          <BigButton variant="soft">Terug naar huiswerk</BigButton>
        </Link>
      </Card>
    );
  }

  const vak = SUBJECTS[def.subject];
  const alKlaar = state.homework.find((h) => h.id === id)?.completedDag !== null;

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle icon={vak.icon} title={`${vak.naam} — ${def.titel}`} />

      {resultaat ? (
        <Card className="text-center">
          <p className="text-5xl">{resultaat.correct / resultaat.totaal >= 0.6 ? "✅" : "💪"}</p>
          <h2 className="mt-3 text-2xl font-bold">
            {resultaat.correct} / {resultaat.totaal} goed
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {state.currentDag <= def.deadlineDag
              ? "Huiswerk voltooid en op tijd ingeleverd. Netjes!"
              : "Huiswerk voltooid, maar de deadline was al voorbij."}
          </p>
          <BigButton className="mt-5" onClick={() => navigate({ to: "/spel/huiswerk" })}>
            Terug naar huiswerk →
          </BigButton>
        </Card>
      ) : alKlaar ? (
        <Card className="text-sm text-muted-foreground">
          Dit huiswerk heb je al gemaakt.
          <Link to="/spel/huiswerk" className="mt-3 block">
            <BigButton variant="soft">Terug naar huiswerk</BigButton>
          </Link>
        </Card>
      ) : (
        <Quiz
          vragen={oefening.vragen}
          intro={oefening.intro}
          onKlaar={(correct, totaal) => {
            dispatch({ type: "HUISWERK_KLAAR", id, correct, totaal });
            setResultaat({ correct, totaal });
          }}
        />
      )}
    </div>
  );
}
