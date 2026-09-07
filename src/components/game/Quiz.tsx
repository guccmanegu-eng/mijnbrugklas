import { useState } from "react";
import type { Question } from "@/lib/game/data";
import { BigButton, Card, Bar } from "./bits";
import { cn } from "@/lib/utils";

export function Quiz({
  vragen,
  intro,
  onKlaar,
  knopLabel = "Volgende",
}: {
  vragen: Question[];
  intro?: string | undefined;
  onKlaar: (correct: number, totaal: number) => void;
  knopLabel?: string;
}) {
  const [index, setIndex] = useState(0);
  const [gekozen, setGekozen] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);

  const vraag = vragen[index];
  if (!vraag) return null;
  const laatste = index === vragen.length - 1;

  const volgende = () => {
    if (gekozen === null) return;
    const nieuwCorrect = correct + (gekozen === vraag.juist ? 1 : 0);
    if (laatste) {
      onKlaar(nieuwCorrect, vragen.length);
      return;
    }
    setCorrect(nieuwCorrect);
    setGekozen(null);
    setIndex(index + 1);
  };

  return (
    <div className="space-y-4">
      {intro ? (
        <Card className="bg-secondary/60 whitespace-pre-line text-sm leading-relaxed">{intro}</Card>
      ) : null}

      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>
            Vraag {index + 1} van {vragen.length}
          </span>
          <span>{Math.round((index / vragen.length) * 100)}%</span>
        </div>
        <Bar value={(index / vragen.length) * 100} />
      </div>

      <Card>
        <h2 className="text-lg font-bold">{vraag.vraag}</h2>
        <div className="mt-4 space-y-2.5">
          {vraag.opties.map((optie, i) => {
            const isGekozen = gekozen === i;
            const toonGoed = gekozen !== null && i === vraag.juist;
            const toonFout = isGekozen && i !== vraag.juist;
            return (
              <button
                key={optie}
                disabled={gekozen !== null}
                onClick={() => setGekozen(i)}
                className={cn(
                  "w-full rounded-2xl border-2 px-4 py-3.5 text-left text-sm font-semibold transition-all",
                  toonGoed
                    ? "border-mint bg-mint/12 text-mint"
                    : toonFout
                      ? "border-rose bg-rose/10 text-rose"
                      : "border-border bg-card hover:border-brand hover:bg-brand/5",
                )}
              >
                {optie}
                {toonGoed ? " ✅" : toonFout ? " ❌" : ""}
              </button>
            );
          })}
        </div>
        <BigButton className="mt-5" disabled={gekozen === null} onClick={volgende}>
          {laatste ? "Klaar" : knopLabel} →
        </BigButton>
      </Card>
    </div>
  );
}
