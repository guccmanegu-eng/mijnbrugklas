import { useRef, useState } from "react";
import { snd } from "@/lib/game/sound";
import {
  Hud,
  HudPill,
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
  type Deeltje,
  type GameProps,
} from "./kit";

/* ========================================================================
 * Wespenvanger: klik op de wesp, niet op je klasgenoten.
 * ===================================================================== */

const W = 520;
const H = 380;
const TIJD = 20;
const KINDEREN = ["🧑", "👧", "🧒", "👦", "👩‍🦱", "🧑‍🦰", "👱", "🧕", "👨‍🦱", "👧"];

const PLEKKEN: { x: number; y: number; e: string }[] = [];
for (let r = 0; r < 3; r++)
  for (let k = 0; k < 4; k++)
    PLEKKEN.push({ x: 80 + k * 120, y: 140 + r * 85, e: KINDEREN[(r * 4 + k) % KINDEREN.length]! });

export function Wesp({ onKlaar }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kleur = useRef(themaKleuren());
  const [hud, setHud] = useState({ tijd: TIJD, gevangen: 0, mis: 0 });
  const s = useRef({
    tijd: TIJD,
    wx: 460,
    wy: 60,
    doelX: 200,
    doelY: 200,
    snelheid: 140,
    rust: 0,
    gevangen: 0,
    geraakt: 0,
    deeltjes: [] as Deeltje[],
    au: [] as { x: number; y: number; life: number; t: string }[],
    hudTimer: 0,
    klaar: false,
    klikX: -100,
    klikY: -100,
    klikT: 0,
    zoemT: 0,
  });

  const nieuwDoel = () => {
    const st = s.current;
    const naarKind = Math.random() < 0.55;
    if (naarKind) {
      const p = PLEKKEN[Math.floor(Math.random() * PLEKKEN.length)]!;
      st.doelX = p.x + (Math.random() - 0.5) * 50;
      st.doelY = p.y - 20 + (Math.random() - 0.5) * 30;
    } else {
      st.doelX = 40 + Math.random() * (W - 80);
      st.doelY = 70 + Math.random() * (H - 110);
    }
  };

  const eindig = () => {
    const st = s.current;
    if (st.klaar) return;
    st.klaar = true;
    snd.bel();
    const punten = Math.max(0, st.gevangen * 15 - st.geraakt * 10);
    window.setTimeout(
      () =>
        onKlaar({
          score: clamp01(punten / 105),
          punten,
          tekst: `${st.gevangen}× de wesp gevangen${st.geraakt ? ` en ${st.geraakt}× per ongeluk een klasgenoot geraakt` : " zonder iemand te raken"}.`,
        }),
      800,
    );
  };

  const klik = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = s.current;
    if (st.klaar || !canvasRef.current) return;
    const { x, y } = canvasPunt(e, canvasRef.current, W, H);
    st.klikX = x;
    st.klikY = y;
    st.klikT = 0.25;
    if (Math.hypot(x - st.wx, y - st.wy) < 30) {
      st.gevangen++;
      snd.pop();
      spawnDeeltjes(st.deeltjes, st.wx, st.wy, 16, [kleur.current.amber, "#222"], 200);
      st.au.push({ x: st.wx, y: st.wy - 20, life: 0.8, t: "Gevangen! 🥤" });
      // nieuwe wesp komt door het raam
      st.wx = Math.random() < 0.5 ? 20 : W - 20;
      st.wy = 50;
      st.snelheid += 28;
      st.rust = 0;
      nieuwDoel();
      return;
    }
    const kind = PLEKKEN.find((p) => Math.hypot(x - p.x, y - p.y) < 24);
    if (kind) {
      st.geraakt++;
      snd.fout();
      st.au.push({ x: kind.x, y: kind.y - 30, life: 1, t: "Au! 😠" });
    }
  };

  useCanvasLoop(canvasRef, W, H, (ctx, dt, t) => {
    const st = s.current;
    const c = kleur.current;
    if (!st.klaar) {
      st.tijd -= dt;
      if (st.tijd <= 0) {
        st.tijd = 0;
        eindig();
      }
      if (st.rust > 0) {
        st.rust -= dt;
      } else {
        const dx = st.doelX - st.wx;
        const dy = st.doelY - st.wy;
        const d = Math.hypot(dx, dy);
        if (d < 8) {
          if (Math.random() < 0.35) st.rust = 0.4 + Math.random() * 0.5;
          nieuwDoel();
        } else {
          const v = st.snelheid * dt;
          st.wx += (dx / d) * v + Math.sin(t * 17) * 1.4;
          st.wy += (dy / d) * v + Math.cos(t * 13) * 1.4;
        }
      }
      st.zoemT -= dt;
      if (st.zoemT <= 0) {
        st.zoemT = 0.5;
        snd.zoem();
      }
      st.hudTimer += dt;
      if (st.hudTimer > 0.15) {
        st.hudTimer = 0;
        setHud({ tijd: st.tijd, gevangen: st.gevangen, mis: st.geraakt });
      }
    }

    /* tekenen: klaslokaal */
    ctx.fillStyle = "#f3efe6";
    ctx.fillRect(0, 0, W, H);
    // schoolbord
    ctx.fillStyle = "#2f4f3e";
    roundRect(ctx, 120, 14, 280, 64, 8);
    ctx.fill();
    ctx.fillStyle = "#e9f1e6";
    ctx.font = "bold 15px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Hoofdstuk 2 · Insecten 🐞", 260, 46);
    // ramen
    for (const x of [10, W - 50]) {
      ctx.fillStyle = "#bfe3ff";
      roundRect(ctx, x, 20, 40, 60, 6);
      ctx.fill();
    }
    // tafels + kinderen
    for (const p of PLEKKEN) {
      ctx.fillStyle = "#c9a26b";
      roundRect(ctx, p.x - 40, p.y + 8, 80, 26, 6);
      ctx.fill();
      const bang = Math.hypot(p.x - st.wx, p.y - st.wy) < 70;
      emoji(ctx, bang ? "😱" : p.e, p.x, p.y - 6 + (bang ? Math.sin(t * 30) * 2 : 0), 30);
    }
    // wesp
    const vleugel = Math.sin(t * 60) > 0 ? 1 : 0.85;
    ctx.save();
    ctx.translate(st.wx, st.wy);
    ctx.scale(st.doelX < st.wx ? -1 : 1, vleugel);
    emoji(ctx, "🐝", 0, 0, 26);
    ctx.restore();
    // klik-cirkel
    if (st.klikT > 0) {
      st.klikT -= dt;
      ctx.strokeStyle = c.brand;
      ctx.lineWidth = 3;
      ctx.globalAlpha = st.klikT * 4;
      ctx.beginPath();
      ctx.arc(st.klikX, st.klikY, 30 - st.klikT * 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    updateDeeltjes(ctx, st.deeltjes, dt);
    for (let i = st.au.length - 1; i >= 0; i--) {
      const a = st.au[i]!;
      a.life -= dt;
      a.y -= 30 * dt;
      if (a.life <= 0) {
        st.au.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.min(1, a.life * 2);
      ctx.fillStyle = a.t.startsWith("Au") ? c.rose : c.mint;
      ctx.font = "bold 16px ui-sans-serif, system-ui";
      ctx.fillText(a.t, a.x, a.y);
      ctx.globalAlpha = 1;
    }
  });

  return (
    <div>
      <Hud>
        <HudPill tone={hud.tijd < 6 ? "bad" : "warn"}>⏱ {Math.ceil(hud.tijd)}s</HudPill>
        <HudPill tone="good">🥤 {hud.gevangen} gevangen</HudPill>
        <HudPill tone="bad">😠 {hud.mis} geraakt</HudPill>
      </Hud>
      <TijdBalk fractie={hud.tijd / TIJD} />
      <SpelCanvas
        canvasRef={canvasRef}
        W={W}
        H={H}
        className="cursor-crosshair"
        onPointerDown={klik}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        🖱️ Klik of tik op de wesp. Hij is makkelijker te vangen als hij even stilzit!
      </p>
    </div>
  );
}
