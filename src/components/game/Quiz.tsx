import { useState } from "react";
import type { Question } from "@/lib/game/data";
import { BigButton, Card, Bar } from "./bits";
import { cn } from "@/lib/utils";

const normaliseer = (s: string) =>
  s
    .toLowerCase()
    .replace(/[€.!?]/g, (m) => (m === "." ? "," : ""))
    .replace(/\s+/g, " ")
    .replace(/\s*([/=])\s*/g, "$1")
    .replace(/,00$/, "")
    .trim();

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
  const [invoer, setInvoer] = useState("");
  const [gecontroleerd, setGecontroleerd] = useState<boolean | null>(null);
  const [toonHint, setToonHint] = useState(false);
  const [correct, setCorrect] = useState(0);

  const vraag = vragen[index];
  if (!vraag) return null;
  const laatste = index === vragen.length - 1;

  const isGoed = vraag.open
    ? vraag.antwoorden.some((a) => normaliseer(a) === normaliseer(invoer))
    : gekozen === vraag.juist;
  const beantwoord = vraag.open ? gecontroleerd !== null : gekozen !== null;

  const controleer = () => {
    if (!invoer.trim()) return;
    setGecontroleerd(isGoed);
  };

  const volgende = () => {
    if (!beantwoord) return;
    const nieuwCorrect = correct + (isGoed ? 1 : 0);
    if (laatste) {
      onKlaar(nieuwCorrect, vragen.length);
      return;
    }
    setCorrect(nieuwCorrect);
    setGekozen(null);
    setInvoer("");
    setGecontroleerd(null);
    setToonHint(false);
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

        {vraag.open ? (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (beantwoord) volgende();
              else controleer();
            }}
          >
            <input
              autoFocus
              value={invoer}
              disabled={beantwoord}
              onChange={(e) => setInvoer(e.target.value)}
              placeholder="Typ je antwoord…"
              className={cn(
                "w-full rounded-2xl border-2 bg-card px-4 py-3.5 text-base font-semibold outline-none transition-all focus:border-brand",
                gecontroleerd === true && "border-mint bg-mint/12 text-mint",
                gecontroleerd === false && "border-rose bg-rose/10 text-rose",
              )}
            />
            {!beantwoord && vraag.hint ? (
              toonHint ? (
                <p className="text-sm text-muted-foreground">💡 {vraag.hint}</p>
              ) : (
                <button type="button" onClick={() => setToonHint(true)} className="text-sm font-semibold text-brand">
                  💡 Hint nodig?
                </button>
              )
            ) : null}
            {gecontroleerd === false ? (
              <p className="text-sm font-semibold text-rose">
                ❌ Helaas. Goed antwoord: <span className="underline">{vraag.antwoorden[0]}</span>
              </p>
            ) : gecontroleerd === true ? (
              <p className="text-sm font-semibold text-mint">✅ Goed zo!</p>
            ) : null}
            {beantwoord && vraag.uitleg ? <p className="text-sm text-muted-foreground">{vraag.uitleg}</p> : null}
            {beantwoord ? (
              <BigButton type="submit">{laatste ? "Klaar" : knopLabel} →</BigButton>
            ) : (
              <BigButton type="submit" disabled={!invoer.trim()}>
                Controleer
              </BigButton>
            )}
          </form>
        ) : (
          <>
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
            {gekozen !== null && vraag.uitleg ? (
              <p className="mt-3 text-sm text-muted-foreground">{vraag.uitleg}</p>
            ) : null}
            <BigButton className="mt-5" disabled={gekozen === null} onClick={volgende}>
              {laatste ? "Klaar" : knopLabel} →
            </BigButton>
          </>
        )}
      </Card>
    </div>
  );
}
