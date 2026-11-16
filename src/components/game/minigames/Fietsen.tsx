import { useEffect, useRef, useState } from "react";
import { snd } from "@/lib/game/sound";
import {
  Hud,
  HudPill,
  SpelCanvas,
  TijdBalk,
  canvasPunt,
  clamp01,
  emoji,
  spawnDeeltjes,
  themaKleuren,
  updateDeeltjes,
  useCanvasLoop,
  type Deeltje,
  type GameProps,
} from "./kit";

/* ========================================================================
 * Dijk-fietser: fiets naar huis over de dijk, wissel van baan en ontwijk
 * tractors, schapen en plassen. Bovenaanzicht, de weg scrolt omlaag.
 * ===================================================================== */

const W = 360;
const H = 520;
const BANEN = [120, 180, 240];
const AFSTAND = 5000; // meter tot huis
const LEVENS = 3;

type Ding = {
  baan: number;
  y: number;
  e: string;
  soort: "obstakel" | "ster" | "plas";
  geraakt?: boolean;
};

export function Fietsen({ onKlaar }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kleur = useRef(themaKleuren());
  const [hud, setHud] = useState({ meter: 0, levens: LEVENS, sterren: 0 });
  const s = useRef({
    baan: 1,
    x: BANEN[1]!,
    meter: 0,
    snelheid: 230,
    dingen: [] as Ding[],
    spawn: 1,
    levens: LEVENS,
    sterren: 0,
    onkwetsbaar: 0,
    slip: 0,
    deeltjes: [] as Deeltje[],
    klaar: false,
    hudTimer: 0,
    scroll: 0,
    thuisY: -200,
  });

  const wissel = (r: -1 | 1) => {
    const st = s.current;
    if (st.klaar || st.slip > 0) return;
    const n = Math.max(0, Math.min(2, st.baan + r));
    if (n !== st.baan) {
      st.baan = n;
      snd.klik();
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") {
        e.preventDefault();
        wissel(-1);
      }
      if (k === "arrowright" || k === "d") {
        e.preventDefault();
        wissel(1);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const eindig = (thuis: boolean) => {
    const st = s.current;
    if (st.klaar) return;
    st.klaar = true;
    if (thuis) snd.juich();
    else snd.fout();
    const punten = Math.round(st.meter / 20 + st.sterren * 10 + (thuis ? st.levens * 15 : 0));
    window.setTimeout(
      () =>
        onKlaar({
          score: thuis
            ? clamp01(0.55 + st.levens * 0.1 + st.sterren * 0.02)
            : clamp01((st.meter / AFSTAND) * 0.5),
          punten,
          tekst: thuis
            ? `Veilig thuis met ${st.levens} ${st.levens === 1 ? "leven" : "levens"} over en ${st.sterren} sterren!`
            : `Je kwam ${Math.round(st.meter)} van de ${AFSTAND} meter ver. Volgende keer beter opletten op de dijk!`,
        }),
      1100,
    );
  };

  useCanvasLoop(canvasRef, W, H, (ctx, dt, t) => {
    const st = s.current;
    const c = kleur.current;
    const PY = H - 90;

    if (!st.klaar) {
      st.onkwetsbaar = Math.max(0, st.onkwetsbaar - dt);
      st.slip = Math.max(0, st.slip - dt);
      st.snelheid = 230 + (st.meter / AFSTAND) * 170;
      const v = st.snelheid * (st.slip > 0 ? 0.6 : 1);
      st.meter += v * dt * 0.55;
      st.scroll = (st.scroll + v * dt) % 60;
      st.x += (BANEN[st.baan]! - st.x) * Math.min(1, dt * 14);

      if (st.meter < AFSTAND - 250) {
        st.spawn -= dt;
        if (st.spawn <= 0) {
          st.spawn = Math.max(0.45, 1.05 - (st.meter / AFSTAND) * 0.5);
          const r = Math.random();
          const vrij = [0, 1, 2];
          const baan = vrij[Math.floor(Math.random() * 3)]!;
          if (r < 0.15) st.dingen.push({ baan, y: -30, e: "⭐", soort: "ster" });
          else if (r < 0.32) st.dingen.push({ baan, y: -30, e: "💧", soort: "plas" });
          else {
            const e = ["🚜", "🐑", "🐄", "🚗", "🦆", "🚧"][Math.floor(Math.random() * 6)]!;
            st.dingen.push({ baan, y: -30, e, soort: "obstakel" });
            // soms twee tegelijk, maar altijd één baan vrij
            if (st.meter > 1500 && Math.random() < 0.35) {
              const andere = [0, 1, 2].filter((b) => b !== baan);
              st.dingen.push({
                baan: andere[Math.floor(Math.random() * 2)]!,
                y: -30,
                e: "🐑",
                soort: "obstakel",
              });
            }
          }
        }
      } else if (st.thuisY < PY - 20) {
        st.thuisY += v * dt;
      }
      if (st.meter >= AFSTAND && st.thuisY >= PY - 40) eindig(true);

      for (const d of st.dingen) {
        d.y += v * dt * (d.e === "🚗" ? 1.25 : d.e === "🦆" ? 0.8 : 1);
        if (d.geraakt) continue;
        if (Math.abs(d.y - PY) < 26 && d.baan === st.baan) {
          if (d.soort === "ster") {
            d.geraakt = true;
            st.sterren++;
            snd.ster();
            spawnDeeltjes(st.deeltjes, BANEN[d.baan]!, d.y, 12, [c.amber, "#fff"], 150);
          } else if (d.soort === "plas") {
            d.geraakt = true;
            st.slip = 0.8;
            snd.pop();
          } else if (st.onkwetsbaar <= 0) {
            d.geraakt = true;
            st.levens--;
            st.onkwetsbaar = 1.2;
            snd.bots();
            spawnDeeltjes(st.deeltjes, st.x, PY, 14, [c.rose, "#444"], 200);
            if (st.levens <= 0) eindig(false);
          }
        }
      }
      st.dingen = st.dingen.filter((d) => d.y < H + 40);

      st.hudTimer += dt;
      if (st.hudTimer > 0.15) {
        st.hudTimer = 0;
        setHud({ meter: st.meter, levens: st.levens, sterren: st.sterren });
      }
    }

    /* tekenen */
    ctx.fillStyle = "#7cc36a";
    ctx.fillRect(0, 0, W, H);
    // sloot links/rechts
    ctx.fillStyle = "#5aa0d8";
    ctx.fillRect(0, 0, 40, H);
    ctx.fillRect(W - 40, 0, 40, H);
    // dijkweg
    ctx.fillStyle = "#5d5d66";
    ctx.fillRect(86, 0, 188, H);
    ctx.fillStyle = "#c7c7cf";
    ctx.fillRect(84, 0, 4, H);
    ctx.fillRect(272, 0, 4, H);
    ctx.strokeStyle = "#f4f4f4";
    ctx.lineWidth = 3;
    ctx.setLineDash([22, 38]);
    ctx.lineDashOffset = -st.scroll;
    for (const x of [150, 210]) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // decor
    for (let i = 0; i < 6; i++) {
      const y = ((i * 110 + st.scroll * 1.83) % (H + 80)) - 40;
      emoji(ctx, i % 2 ? "🌷" : "🌳", 62, y, 22);
      emoji(ctx, i % 3 ? "🌾" : "🏡", W - 62, (y + 55) % (H + 40), 22);
    }
    // huis
    if (st.meter >= AFSTAND - 250) {
      emoji(ctx, "🏠", W / 2, st.thuisY, 56);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.fillText("THUIS", W / 2, st.thuisY + 38);
    }
    for (const d of st.dingen) {
      if (d.geraakt && d.soort !== "obstakel") continue;
      emoji(ctx, d.e, BANEN[d.baan]!, d.y, d.soort === "plas" ? 30 : 34, d.geraakt ? 0.4 : 1);
    }
    // fietser
    const knip = st.onkwetsbaar > 0 && Math.floor(t * 12) % 2 === 0;
    if (!knip) {
      ctx.save();
      ctx.translate(st.x, PY);
      ctx.rotate(st.slip > 0 ? Math.sin(t * 30) * 0.3 : (BANEN[st.baan]! - st.x) * 0.01);
      emoji(ctx, "🚴", 0, 0, 38);
      ctx.restore();
    }
    updateDeeltjes(ctx, st.deeltjes, dt);
  });

  const tik = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const { x } = canvasPunt(e, canvasRef.current, W, H);
    wissel(x < s.current.x ? -1 : 1);
  };

  return (
    <div>
      <Hud>
        <HudPill tone="brand">🏠 {Math.max(0, Math.round(AFSTAND - hud.meter))} m</HudPill>
        <HudPill tone="bad">
          {"❤️".repeat(Math.max(0, hud.levens))}
          {"🖤".repeat(Math.max(0, LEVENS - hud.levens))}
        </HudPill>
        <HudPill tone="warn">⭐ {hud.sterren}</HudPill>
      </Hud>
      <TijdBalk fractie={1 - hud.meter / AFSTAND} className="[&>div]:bg-brand" />
      <SpelCanvas
        canvasRef={canvasRef}
        W={W}
        H={H}
        className="mx-auto max-w-xs"
        onPointerDown={tik}
      />
      <p className="mt-2 text-center text-xs text-muted-foreground">
        ⌨️ ← → of A D · of tik links/rechts van je fiets
      </p>
    </div>
  );
}
