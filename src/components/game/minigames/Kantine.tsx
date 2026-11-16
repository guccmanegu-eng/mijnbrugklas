import { useRef, useState } from "react";
import { snd } from "@/lib/game/sound";
import {
  Hud,
  HudPill,
  PadKnoppen,
  SpelCanvas,
  TijdBalk,
  canvasPunt,
  clamp01,
  emoji,
  roundRect,
  spawnDeeltjes,
  themaKleuren,
  updateDeeltjes,
  useCanvasLoop,
  useToetsen,
  type Deeltje,
  type GameProps,
} from "./kit";

/* ========================================================================
 * Kantine-rush: vang gezond eten op je dienblad, ontwijk de rommel.
 * ===================================================================== */

const W = 480;
const H = 520;
const TIJD = 35;
const GEZOND = ["🍎", "🥪", "🥕", "🍌", "🥛", "🧀", "🥒", "🍐"];
const ONGEZOND = ["🍬", "🥤", "🍩", "🍭"];

type Item = { x: number; y: number; v: number; e: string; goed: boolean; rot: number };

export function Kantine({ onKlaar }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useToetsen();
  const kleur = useRef(themaKleuren());
  const [hud, setHud] = useState({ tijd: TIJD, punten: 0, combo: 0, gemist: 0 });
  const s = useRef({
    bx: W / 2,
    doelX: null as number | null,
    tijd: TIJD,
    items: [] as Item[],
    spawn: 0,
    punten: 0,
    combo: 0,
    gemist: 0,
    gevangen: 0,
    deeltjes: [] as Deeltje[],
    teksten: [] as { x: number; y: number; t: string; life: number; kleur: string }[],
    klaar: false,
    hudTimer: 0,
    schud: 0,
  });

  const eindig = () => {
    const st = s.current;
    if (st.klaar) return;
    st.klaar = true;
    snd.gong();
    window.setTimeout(
      () =>
        onKlaar({
          score: clamp01(st.punten / 320),
          punten: Math.max(0, st.punten),
          tekst: `Je ving ${st.gevangen} gezonde dingen en liet er ${st.gemist} vallen.`,
        }),
      900,
    );
  };

  useCanvasLoop(canvasRef, W, H, (ctx, dt, t) => {
    const st = s.current;
    const c = kleur.current;
    const BW = 92;
    const BY = H - 46;

    if (!st.klaar) {
      st.tijd -= dt;
      if (st.tijd <= 0 || st.gemist >= 5) {
        st.tijd = Math.max(0, st.tijd);
        eindig();
      }
      const voortgang = 1 - st.tijd / TIJD;
      // dienblad
      let dx = 0;
      if (keys.current.has("left")) dx -= 1;
      if (keys.current.has("right")) dx += 1;
      if (dx) {
        st.doelX = null;
        st.bx += dx * 380 * dt;
      } else if (st.doelX !== null) {
        st.bx += (st.doelX - st.bx) * Math.min(1, dt * 14);
      }
      st.bx = Math.max(BW / 2, Math.min(W - BW / 2, st.bx));

      // nieuw eten
      st.spawn -= dt;
      if (st.spawn <= 0) {
        st.spawn = 0.75 - voortgang * 0.4;
        const goed = Math.random() > 0.3 + voortgang * 0.1;
        const lijst = goed ? GEZOND : ONGEZOND;
        st.items.push({
          x: 30 + Math.random() * (W - 60),
          y: -20,
          v: 130 + voortgang * 170 + Math.random() * 60,
          e: lijst[Math.floor(Math.random() * lijst.length)]!,
          goed,
          rot: (Math.random() - 0.5) * 4,
        });
      }

      for (let i = st.items.length - 1; i >= 0; i--) {
        const it = st.items[i]!;
        it.y += it.v * dt;
        if (it.y > BY - 14 && it.y < BY + 10 && Math.abs(it.x - st.bx) < BW / 2 + 8) {
          st.items.splice(i, 1);
          if (it.goed) {
            st.combo++;
            st.gevangen++;
            const p = 10 + Math.min(st.combo, 10) * 2;
            st.punten += p;
            snd.combo(st.combo);
            spawnDeeltjes(st.deeltjes, it.x, BY - 10, 8, [c.mint, c.amber], 140);
            st.teksten.push({ x: it.x, y: BY - 30, t: `+${p}`, life: 0.8, kleur: c.mint });
          } else {
            st.combo = 0;
            st.punten -= 15;
            st.schud = 0.25;
            snd.fout();
            st.teksten.push({
              x: it.x,
              y: BY - 30,
              t: it.e === "🥤" ? "Energiedrank! −15" : "Snoep! −15",
              life: 1,
              kleur: c.rose,
            });
          }
          continue;
        }
        if (it.y > H + 20) {
          st.items.splice(i, 1);
          if (it.goed) {
            st.gemist++;
            st.combo = 0;
            snd.pop();
          }
        }
      }

      st.hudTimer += dt;
      if (st.hudTimer > 0.15) {
        st.hudTimer = 0;
        setHud({ tijd: st.tijd, punten: st.punten, combo: st.combo, gemist: st.gemist });
      }
    }

    /* tekenen */
    const sx = st.schud > 0 ? (Math.random() - 0.5) * 8 : 0;
    st.schud = Math.max(0, st.schud - dt);
    ctx.save();
    ctx.translate(sx, 0);
    // kantine-achtergrond
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#fff7e6");
    g.addColorStop(1, "#ffe7c2");
    ctx.fillStyle = g;
    ctx.fillRect(-10, 0, W + 20, H);
    // menubord
    ctx.fillStyle = "#2e3a2f";
    roundRect(ctx, 20, 14, W - 40, 44, 10);
    ctx.fill();
    ctx.fillStyle = "#f4f1de";
    ctx.font = "bold 16px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("KANTINE · broodje kaas €1,50 · appel €0,50", W / 2, 36);
    // toonbank
    ctx.fillStyle = "#c98b4f";
    ctx.fillRect(-10, H - 22, W + 20, 22);

    for (const it of st.items) {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(Math.sin(t * it.rot) * 0.3);
      emoji(ctx, it.e, 0, 0, 30);
      ctx.restore();
    }

    // dienblad
    ctx.fillStyle = c.brand;
    roundRect(ctx, st.bx - BW / 2, BY, BW, 14, 6);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(st.bx - BW / 2 + 8, BY + 3, BW - 16, 3);
    emoji(ctx, "🧑‍🎓", st.bx, BY + 30, 26);

    updateDeeltjes(ctx, st.deeltjes, dt);
    for (let i = st.teksten.length - 1; i >= 0; i--) {
      const tx = st.teksten[i]!;
      tx.life -= dt;
      tx.y -= 40 * dt;
      if (tx.life <= 0) {
        st.teksten.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.min(1, tx.life * 2);
      ctx.fillStyle = tx.kleur;
      ctx.font = "bold 18px ui-sans-serif, system-ui";
      ctx.fillText(tx.t, tx.x, tx.y);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  });

  const sleep = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    if (e.type === "pointermove" && e.buttons === 0 && e.pointerType !== "mouse") return;
    s.current.doelX = canvasPunt(e, canvasRef.current, W, H).x;
  };

  return (
    <div>
      <Hud>
        <HudPill tone={hud.tijd < 8 ? "bad" : "warn"}>⏱ {Math.ceil(hud.tijd)}s</HudPill>
        <HudPill tone="brand">⭐ {hud.punten}</HudPill>
        {hud.combo >= 3 ? <HudPill tone="good">🔥 combo ×{hud.combo}</HudPill> : null}
        <HudPill tone="bad">💔 {hud.gemist}/5 laten vallen</HudPill>
      </Hud>
      <TijdBalk fractie={hud.tijd / TIJD} />
      <SpelCanvas
        canvasRef={canvasRef}
        W={W}
        H={H}
        className="mx-auto max-w-md"
        onPointerDown={sleep}
        onPointerMove={sleep}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          ⌨️ ← → of A D · of beweeg je muis/vinger over het spel
        </p>
        <PadKnoppen keys={keys} richtingen={["left", "right"]} className="sm:hidden" />
      </div>
    </div>
  );
}
