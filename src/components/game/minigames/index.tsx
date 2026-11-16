import { useEffect, useState, type ComponentType } from "react";
import { MINIGAMES } from "@/lib/game/data";
import type { GameId, MiniResult } from "@/lib/game/events";
import { snd } from "@/lib/game/sound";
import { Snel } from "../MiniGame";
import { Afval } from "./Afval";
import { Evacuatie } from "./Evacuatie";
import { Fietsen } from "./Fietsen";
import { Kantine } from "./Kantine";
import { Kluiskraker } from "./Kluiskraker";
import { Memory } from "./Memory";
import { Penalty } from "./Penalty";
import { Stroomstoring } from "./Stroomstoring";
import { Wesp } from "./Wesp";
import { Woordregen } from "./Woordregen";
import type { GameProps } from "./kit";

function Rekenrace({ onKlaar }: GameProps) {
  const def = MINIGAMES["wi-opdr"];
  if (!def || def.type !== "snel") return null;
  return <Snel sommen={def.sommen} seconden={def.seconden} onKlaar={onKlaar} />;
}

export const GAMES: Record<GameId, ComponentType<GameProps>> = {
  evacuatie: Evacuatie,
  stroom: Stroomstoring,
  kantine: Kantine,
  afval: Afval,
  penalty: Penalty,
  kluis: Kluiskraker,
  wesp: Wesp,
  memory: Memory,
  woordregen: Woordregen,
  rekenrace: Rekenrace,
  fietsen: Fietsen,
};

/** Toont 3-2-1 en start dan de minigame. */
export function GameHost({
  game,
  onKlaar,
  aftellen = true,
}: {
  game: GameId;
  onKlaar: (r: MiniResult) => void;
  aftellen?: boolean;
}) {
  const [tel, setTel] = useState(aftellen ? 3 : 0);
  useEffect(() => {
    if (tel <= 0) return;
    const t = window.setTimeout(() => setTel((x) => x - 1), 650);
    return () => window.clearTimeout(t);
  }, [tel]);
  useEffect(() => {
    if (!aftellen) return;
    if (tel > 0) snd.klik();
    else snd.ster();
  }, [tel, aftellen]);

  if (tel > 0)
    return (
      <div className="flex h-64 items-center justify-center">
        <span key={tel} className="animate-pop-in font-display text-8xl font-extrabold text-brand">
          {tel}
        </span>
      </div>
    );
  const Comp = GAMES[game];
  return <Comp onKlaar={onKlaar} />;
}
