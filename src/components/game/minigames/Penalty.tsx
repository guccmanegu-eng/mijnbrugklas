import { useEffect, useRef, useState } from "react";
import { snd } from "@/lib/game/sound";
import {
  Hud,
  HudPill,
  SpelCanvas,
  clamp01,
  emoji,
  roundRect,
  spawnDeeltjes,
  themaKleuren,
  updateDeeltjes,
  useCanvasLoop,
  type Deeltje,
  type GameProps,
} from "./kit";

/* ========================================================================
 * Penalty-shootout: richten, kracht kiezen en scoren in de pauzefinale.
 * ===================================================================== */

const W = 480;
const H = 400;
const POGINGEN = 5;
const GOAL_L = 110;
const GOAL_R = 370;
const GOAL_Y = 70;
const GOAL_H = 90;
const BAL_START = { x: W / 2, y: H - 70 };

type Fase = "richten" | "kracht" | "schot" | "uitslag";
type Uitslag = "goal" | "redding" | "over" | "naast";

export function Penalty({ onKlaar }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kleur = useRef(themaKleuren());
  const [hud, setHud] = useState({
    poging: 1,
    goals: 0,
    fase: "richten" as Fase,
    tekst: "Klik of druk op spatie om te richten",
  });
  const resultaten = useRef<Uitslag[]>([]);
  const s = useRef({
    fase: "richten" as Fase,
    richt: 0,
    kracht: 0,
    t: 0,
    schotT: 0,
    doelX: 0,
    doelY: 0,
    keeperX: W / 2,
    keeperDoel: W / 2,
    uitslag: null as Uitslag | null,
    uitslagT: 0,
    goals: 0,
    poging: 1,
    deeltjes: [] as Deeltje[],
    klaar: false,
  });

  const klik = () => {
    const st = s.current;
    if (st.klaar) return;
    if (st.fase === "richten") {
      st.fase = "kracht";
      snd.klik();
      setHud((h) => ({
        ...h,
        fase: "kracht",
        tekst: "Nu de kracht! Niet te hard, niet te zacht.",
      }));
    } else if (st.fase === "kracht") {
      st.fase = "schot";
      st.schotT = 0;
      snd.schop();
      const r = st.richt; // -1..1
      const p = st.kracht; // 0..1
      st.doelX = W / 2 + r * ((GOAL_R - GOAL_L) / 2 + 22);
      st.doelY = p > 0.9 ? GOAL_Y - 40 : GOAL_Y + GOAL_H - 10 - p * (GOAL_H - 20);
      // keeper kiest een hoek
      const keuze = Math.random();
      const kant = keuze < 0.38 ? -1 : keuze < 0.76 ? 1 : 0;
      st.keeperDoel = W / 2 + kant * 85;
      let u: Uitslag;
      if (Math.abs(r) > 0.92) u = "naast";
      else if (p > 0.9) u = "over";
      else {
        const bereik = p < 0.35 ? 95 : p > 0.7 ? 48 : 62;
        u = Math.abs(st.doelX - st.keeperDoel) < bereik ? "redding" : "goal";
      }
      st.uitslag = u;
      setHud((h) => ({ ...h, fase: "schot", tekst: "…" }));
    } else if (st.fase === "uitslag" && st.uitslagT > 0.6) {
      volgende();
    }
  };

  const volgende = () => {
    const st = s.current;
    if (st.poging >= POGINGEN) {
      if (st.klaar) return;
      st.klaar = true;
      const goals = st.goals;
      const hoeken = resultaten.current.filter((x) => x === "goal").length;
      onKlaar({
        score: clamp01(goals / POGINGEN),
        punten: goals * 20 + hoeken,
        tekst:
          goals >= 3
            ? `${goals} van de ${POGINGEN} gescoord — 1B wint het pauzetoernooi! 🏆`
            : `${goals} van de ${POGINGEN} gescoord. 1C wint nipt, maar het was een mooie wedstrijd.`,
      });
      return;
    }
    st.poging++;
    st.fase = "richten";
    st.uitslag = null;
    st.keeperX = W / 2;
    st.keeperDoel = W / 2;
    setHud((h) => ({
      ...h,
      poging: st.poging,
      fase: "richten",
      tekst: "Klik of druk op spatie om te richten",
    }));
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        klik();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  useCanvasLoop(canvasRef, W, H, (ctx, dt, t) => {
    const st = s.current;
    const c = kleur.current;
    st.t += dt;
    if (st.fase === "richten") st.richt = Math.sin(st.t * 2.4);
    if (st.fase === "kracht") st.kracht = (Math.sin(st.t * 3.2 - Math.PI / 2) + 1) / 2;
    if (st.fase === "schot") {
      st.schotT += dt / 0.55;
      st.keeperX += (st.keeperDoel - st.keeperX) * Math.min(1, dt * 7);
      if (st.schotT >= 1) {
        st.schotT = 1;
        st.fase = "uitslag";
        st.uitslagT = 0;
        resultaten.current.push(st.uitslag!);
        if (st.uitslag === "goal") {
          st.goals++;
          snd.juich();
          spawnDeeltjes(
            st.deeltjes,
            st.doelX,
            st.doelY,
            40,
            [c.mint, c.amber, c.brand, c.rose],
            260,
          );
        } else snd.fout();
        const tekst = {
          goal: "⚽ GOAL! De hele klas juicht!",
          redding: "🧤 Gestopt door de keeper!",
          over: "🚀 Over! Iets minder hard.",
          naast: "↗️ Naast! Iets minder schuin.",
        }[st.uitslag!];
        setHud({
          poging: st.poging,
          goals: st.goals,
          fase: "uitslag",
          tekst: `${tekst}  (klik om door te gaan)`,
        });
      }
    }
    if (st.fase === "uitslag") {
      st.uitslagT += dt;
      if (st.uitslagT > 2.2) volgende();
    }

    /* tekenen: veld */
    ctx.fillStyle = "#4caf50";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
      ctx.fillRect(0, i * 50, W, 50);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 3;
    ctx.strokeRect(60, GOAL_Y + GOAL_H, W - 120, 120);
    ctx.beginPath();
    ctx.arc(W / 2, H - 70, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    // publiek
    for (let i = 0; i < 16; i++)
      emoji(
        ctx,
        i % 3 ? "🧑" : "👧",
        18 + i * 30,
        18 +
          Math.abs(Math.sin(t * 6 + i)) * (st.fase === "uitslag" && st.uitslag === "goal" ? 8 : 2),
        20,
      );
    // doel
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(GOAL_L, GOAL_Y, GOAL_R - GOAL_L, GOAL_H);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    for (let x = GOAL_L; x <= GOAL_R; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, GOAL_Y);
      ctx.lineTo(x, GOAL_Y + GOAL_H);
      ctx.stroke();
    }
    for (let y = GOAL_Y; y <= GOAL_Y + GOAL_H; y += 14) {
      ctx.beginPath();
      ctx.moveTo(GOAL_L, y);
      ctx.lineTo(GOAL_R, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(GOAL_L, GOAL_Y + GOAL_H);
    ctx.lineTo(GOAL_L, GOAL_Y);
    ctx.lineTo(GOAL_R, GOAL_Y);
    ctx.lineTo(GOAL_R, GOAL_Y + GOAL_H);
    ctx.stroke();

    // keeper
    const duik = st.fase === "schot" || st.fase === "uitslag" ? (st.keeperDoel - W / 2) / 85 : 0;
    ctx.save();
    ctx.translate(
      st.fase === "richten" || st.fase === "kracht" ? W / 2 + Math.sin(t * 3) * 18 : st.keeperX,
      GOAL_Y + GOAL_H - 26,
    );
    ctx.rotate(duik * 0.9 * Math.min(1, st.schotT * 2));
    emoji(ctx, "🧍", 0, 0, 46);
    emoji(ctx, "🧤", -18, -8, 16);
    emoji(ctx, "🧤", 18, -8, 16);
    ctx.restore();

    // bal
    let bx = BAL_START.x;
    let by = BAL_START.y;
    let bs = 26;
    if (st.fase === "schot" || st.fase === "uitslag") {
      const e = st.schotT;
      bx = BAL_START.x + (st.doelX - BAL_START.x) * e;
      by = BAL_START.y + (st.doelY - BAL_START.y) * e - Math.sin(e * Math.PI) * 30;
      bs = 26 - e * 10;
      if (st.uitslag === "redding" && e > 0.85) {
        bx += (e - 0.85) * 300 * Math.sign(bx - st.keeperX || 1);
      }
    }
    emoji(ctx, "⚽", bx, by, bs);

    // richtpijl
    if (st.fase === "richten" || st.fase === "kracht") {
      const tx = W / 2 + st.richt * ((GOAL_R - GOAL_L) / 2 + 22);
      ctx.strokeStyle = c.amber;
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(BAL_START.x, BAL_START.y - 16);
      ctx.lineTo(tx, GOAL_Y + GOAL_H / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      emoji(ctx, "🎯", tx, GOAL_Y + GOAL_H / 2, 22);
    }
    // krachtmeter
    if (st.fase === "kracht") {
      const mx = W - 44;
      const my = H - 170;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      roundRect(ctx, mx, my, 22, 140, 8);
      ctx.fill();
      const zones = [
        { van: 0, tot: 0.35, k: "#f6c34a" },
        { van: 0.35, tot: 0.9, k: "#41c46b" },
        { van: 0.9, tot: 1, k: "#e5484d" },
      ];
      for (const z of zones) {
        ctx.fillStyle = z.k;
        ctx.fillRect(mx + 4, my + 4 + (1 - z.tot) * 132, 14, (z.tot - z.van) * 132);
      }
      const y = my + 4 + (1 - st.kracht) * 132;
      ctx.fillStyle = "#fff";
      ctx.fillRect(mx - 6, y - 2, 34, 4);
    }
    updateDeeltjes(ctx, st.deeltjes, dt);
  });

  return (
    <div>
      <Hud>
        <HudPill tone="muted">
          🥅 Poging {hud.poging}/{POGINGEN}
        </HudPill>
        <HudPill tone="good">⚽ {hud.goals} goals</HudPill>
        <span className="flex gap-1">
          {Array.from({ length: POGINGEN }, (_, i) => {
            const r = resultaten.current[i];
            return (
              <span key={i} className="text-base">
                {r === undefined ? "⚪" : r === "goal" ? "🟢" : "🔴"}
              </span>
            );
          })}
        </span>
      </Hud>
      <SpelCanvas
        canvasRef={canvasRef}
        W={W}
        H={H}
        className="mx-auto max-w-lg cursor-pointer"
        onPointerDown={klik}
      />
      <p className="mt-2 min-h-[1.5rem] text-center text-sm font-semibold">{hud.tekst}</p>
    </div>
  );
}
