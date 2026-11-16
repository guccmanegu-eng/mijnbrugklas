import { useEffect, useState } from "react";
import { SKILL_META, type SkillId } from "@/lib/game/data";
import { EVENT_BY_ID, eventEffect, eventXp, type MiniResult } from "@/lib/game/events";
import { snd } from "@/lib/game/sound";
import { useGame } from "@/lib/game/state";
import { cn } from "@/lib/utils";
import { BigButton, Card } from "./bits";
import { ResultaatKaart } from "./MiniGame";
import { GameHost } from "./minigames";

/* ========================================================================
 * Live event: onderbreekt de schooldag met een verhaal + minigame.
 * ===================================================================== */

type Fase = "intro" | "spel" | "klaar";

export function LiveEventDialog() {
  const { state, dispatch } = useGame();
  const def = state.pendingEvent ? EVENT_BY_ID[state.pendingEvent] : undefined;
  const [fase, setFase] = useState<Fase>("intro");
  const [res, setRes] = useState<MiniResult | null>(null);

  useEffect(() => {
    setFase("intro");
    setRes(null);
    if (!def) return;
    if (def.alarm) snd.sirene();
    else snd.bel();
  }, [def]);

  // tijdens het spel niet per ongeluk de pagina laten scrollen met pijltjes/spatie
  useEffect(() => {
    if (fase !== "spel") return;
    const h = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", " "].includes(e.key) &&
        (e.target as HTMLElement)?.tagName !== "INPUT"
      )
        e.preventDefault();
    };
    window.addEventListener("keydown", h, { passive: false });
    return () => window.removeEventListener("keydown", h);
  }, [fase]);

  if (!def) return null;

  const toon = {
    rose: "border-rose bg-rose/10 text-rose",
    amber: "border-amber bg-amber/15 text-amber",
    brand: "border-brand bg-brand/10 text-brand",
    mint: "border-mint bg-mint/12 text-mint",
  }[def.toon];

  const effect = res ? eventEffect(def, res.score) : {};

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-end justify-center p-0 backdrop-blur-sm sm:items-center sm:p-5",
        def.alarm && fase === "intro" ? "bg-rose/40" : "bg-ink/55",
      )}
    >
      <Card
        className={cn(
          "max-h-[96vh] w-full overflow-y-auto rounded-b-none sm:rounded-3xl",
          fase === "spel" ? "max-w-3xl" : "max-w-lg",
          def.alarm && fase === "intro" && "animate-alarm border-4",
        )}
      >
        {fase === "intro" ? (
          <div className="animate-pop-in">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 text-4xl",
                  toon,
                  def.alarm && "animate-pulse",
                )}
              >
                {def.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                  📢 Live event
                </p>
                <h2 className={cn("text-2xl font-extrabold", def.alarm && "text-rose")}>
                  {def.titel}
                </h2>
                <p className="text-sm font-semibold text-muted-foreground">{def.kop}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed">{def.intro}</p>
            <ul className="mt-4 space-y-1.5 rounded-2xl bg-secondary p-4 text-sm">
              {def.regels.map((r) => (
                <li key={r} className="flex gap-2">
                  <span>👉</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <BigButton
              className={cn("mt-5", def.alarm && "bg-rose hover:bg-rose/90")}
              onClick={() => setFase("spel")}
            >
              {def.alarm ? "🚨 Naar buiten!" : "Aan de slag →"}
            </BigButton>
          </div>
        ) : null}

        {fase === "spel" ? (
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">
                {def.icon} {def.titel}
              </h2>
            </div>
            <GameHost
              game={def.game}
              onKlaar={(r) => {
                setRes(r);
                setFase("klaar");
              }}
            />
          </div>
        ) : null}

        {fase === "klaar" && res ? (
          <ResultaatKaart
            r={res}
            verderLabel="Terug naar school →"
            onVerder={() =>
              dispatch({ type: "EVENT_KLAAR", id: def.id, score: res.score, punten: res.punten })
            }
            extra={
              <div className="mt-4 space-y-3 text-left">
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="rounded-full bg-brand/12 px-3 py-1 text-xs font-bold text-brand">
                    +{eventXp(res.score)} XP
                  </span>
                  {(Object.keys(effect) as SkillId[]).map((k) => {
                    const v = effect[k] ?? 0;
                    if (!v) return null;
                    return (
                      <span
                        key={k}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold",
                          v > 0 ? "bg-mint/15 text-mint" : "bg-rose/15 text-rose",
                        )}
                      >
                        {SKILL_META[k].icon} {SKILL_META[k].naam} {v > 0 ? `+${v}` : v}
                      </span>
                    );
                  })}
                  {def.badge && res.score >= def.badge.minScore ? (
                    <span className="rounded-full bg-amber/20 px-3 py-1 text-xs font-bold text-amber">
                      🏅 Nieuwe badge!
                    </span>
                  ) : null}
                </div>
                <div className="rounded-2xl bg-secondary p-4 text-sm">
                  <p className="font-bold">💡 In het echt</p>
                  <p className="mt-1 text-muted-foreground">{def.tip}</p>
                </div>
              </div>
            }
          />
        ) : null}
      </Card>
    </div>
  );
}
