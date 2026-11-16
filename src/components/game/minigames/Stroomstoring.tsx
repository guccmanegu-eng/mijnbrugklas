import { useRef, useState } from "react";
import { snd } from "@/lib/game/sound";
import {
  Hud,
  HudPill,
  PadKnoppen,
  SpelCanvas,
  TijdBalk,
  clamp01,
  emoji,
  roundRect,
  shuffle,
  spawnDeeltjes,
  themaKleuren,
  updateDeeltjes,
  useCanvasLoop,
  useToetsen,
  beweeg,
  type Deeltje,
  type GameProps,
} from "./kit";

/* ========================================================================
 * Stroomstoring: vind met je zaklamp 4 zekeringen in de donkere kelder
 * en breng ze naar de meterkast. Pas op voor de ratten!
 * ===================================================================== */

const T = 30;
const COLS = 20;
const ROWS = 13;
const W = COLS * T;
const H = ROWS * T;
const TIJD = 50;
const NODIG = 4;

const REKKEN: [number, number, number, number][] = [
  [3, 2, 6, 2],
  [3, 5, 3, 9],
  [6, 5, 9, 6],
  [11, 1, 11, 4],
  [13, 3, 16, 3],
  [6, 9, 10, 10],
  [13, 6, 13, 10],
  [15, 6, 17, 7],
  [16, 9, 18, 10],
];

const geblokkeerd = new Set<string>();
for (const [x0, y0, x1, y1] of REKKEN)
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) geblokkeerd.add(`${x},${y}`);
const vrij = (x: number, y: number) =>
  x >= 1 && y >= 1 && x < COLS - 1 && y < ROWS - 1 && !geblokkeerd.has(`${x},${y}`);

const KAST = { x: 1.5 * T, y: 1.5 * T };

export function Stroomstoring({ onKlaar }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useToetsen();
  const kleur = useRef(themaKleuren());
  const [hud, setHud] = useState({
    tijd: TIJD,
    opgepakt: 0,
    geleverd: 0,
    bericht: "Zoek de zekeringen 🔋 met je zaklamp.",
  });

  const s = useRef(
    (() => {
      const kandidaten: [number, number][] = [];
      for (let y = 1; y < ROWS - 1; y++)
        for (let x = 1; x < COLS - 1; x++)
          if (vrij(x, y) && Math.hypot(x - 1, y - 1) > 6) kandidaten.push([x, y]);
      const gekozen: [number, number][] = [];
      for (const c of shuffle(kandidaten)) {
        if (gekozen.every((g) => Math.hypot(g[0] - c[0], g[1] - c[1]) > 4)) gekozen.push(c);
        if (gekozen.length === NODIG) break;
      }
      return {
        px: 2.5 * T,
        py: 2.5 * T,
        tijd: TIJD,
        zekeringen: gekozen.map(([x, y]) => ({ x: (x + 0.5) * T, y: (y + 0.5) * T, pak: false })),
        ratten: [
          { x: 9.5 * T, y: 3.5 * T, vx: 70, vy: 0 },
          { x: 14.5 * T, y: 11.5 * T, vx: -60, vy: 0 },
          { x: 18.5 * T, y: 5.5 * T, vx: 0, vy: 55 },
        ],
        verlamd: 0,
        geleverd: 0,
        deeltjes: [] as Deeltje[],
        klaar: false,
        bericht: "",
        berichtTijd: 0,
        hudTimer: 0,
        flits: 0,
      };
    })(),
  );

  const melding = (t: string) => {
    s.current.bericht = t;
    s.current.berichtTijd = 2.2;
  };

  const eindig = (gelukt: boolean) => {
    const st = s.current;
    if (st.klaar) return;
    st.klaar = true;
    const opgepakt = st.zekeringen.filter((z) => z.pak).length;
    const punten = Math.round(opgepakt * 20 + (gelukt ? 20 + st.tijd * 3 : 0));
    if (gelukt) {
      snd.level();
      st.flits = 1;
    } else snd.fout();
    setHud((h) => ({
      ...h,
      bericht: gelukt
        ? "💡 De lichten gaan weer aan! De conciërge is je dankbaar."
        : "⏰ De tijd is op. De elektricien neemt het over.",
    }));
    window.setTimeout(
      () =>
        onKlaar({
          score: clamp01(punten / 160),
          punten,
          tekst: gelukt
            ? `Alle zekeringen geplaatst met ${Math.ceil(st.tijd)} seconden over.`
            : `Je vond ${opgepakt} van de ${NODIG} zekeringen.`,
        }),
      1500,
    );
  };

  useCanvasLoop(canvasRef, W, H, (ctx, dt, t) => {
    const st = s.current;
    const c = kleur.current;
    const R = 9;

    if (!st.klaar) {
      st.tijd -= dt;
      st.berichtTijd -= dt;
      st.verlamd = Math.max(0, st.verlamd - dt);
      if (st.tijd <= 0) {
        st.tijd = 0;
        eindig(false);
      }

      const kanStaan = (x: number, y: number) =>
        [
          [-R, -R],
          [R, -R],
          [-R, R],
          [R, R],
        ].every(([ox, oy]) => vrij(Math.floor((x + ox!) / T), Math.floor((y + oy!) / T)));

      let dx = 0;
      let dy = 0;
      if (keys.current.has("up")) dy -= 1;
      if (keys.current.has("down")) dy += 1;
      if (keys.current.has("left")) dx -= 1;
      if (keys.current.has("right")) dx += 1;
      if ((dx || dy) && st.verlamd <= 0) {
        const v = keys.current.has("run") ? 175 : 125;
        const p = { x: st.px, y: st.py };
        beweeg(p, dx, dy, v * dt, T, kanStaan);
        st.px = p.x;
        st.py = p.y;
      }

      for (const z of st.zekeringen) {
        if (!z.pak && Math.hypot(z.x - st.px, z.y - st.py) < 18) {
          z.pak = true;
          snd.ster();
          spawnDeeltjes(st.deeltjes, z.x, z.y, 12, [c.amber, "#fff"], 140);
          const n = st.zekeringen.filter((q) => q.pak).length;
          melding(
            n === NODIG
              ? "🔋 Alle 4! Snel terug naar de meterkast ⚡ linksboven."
              : `🔋 Zekering ${n}/${NODIG} gevonden!`,
          );
        }
      }

      for (const r of st.ratten) {
        const nx = r.x + r.vx * dt;
        const ny = r.y + r.vy * dt;
        if (
          !vrij(
            Math.floor((nx + Math.sign(r.vx) * 8) / T),
            Math.floor((ny + Math.sign(r.vy) * 8) / T),
          )
        ) {
          // draai een willekeurige kant op
          const opties = [
            [70, 0],
            [-70, 0],
            [0, 60],
            [0, -60],
          ] as const;
          const o = opties[Math.floor(Math.random() * 4)]!;
          r.vx = o[0];
          r.vy = o[1];
        } else {
          r.x = nx;
          r.y = ny;
        }
        if (st.verlamd <= 0 && Math.hypot(r.x - st.px, r.y - st.py) < 18) {
          st.verlamd = 1.2;
          st.tijd = Math.max(0, st.tijd - 3);
          snd.bots();
          melding("🐀 Iiieh, een rat! Je schrikt je rot (−3 seconden).");
        }
      }

      const opgepakt = st.zekeringen.filter((z) => z.pak).length;
      if (opgepakt === NODIG && Math.hypot(KAST.x - st.px, KAST.y - st.py) < 26) eindig(true);

      st.hudTimer += dt;
      if (st.hudTimer > 0.2) {
        st.hudTimer = 0;
        setHud({
          tijd: st.tijd,
          opgepakt,
          geleverd: 0,
          bericht:
            st.berichtTijd > 0
              ? st.bericht
              : opgepakt === NODIG
                ? "Terug naar de meterkast ⚡!"
                : "Zoek de zekeringen 🔋 met je zaklamp.",
        });
      }
    }

    /* ===== tekenen ===== */
    ctx.fillStyle = "#4b4f5e";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#8d8a80";
    ctx.fillRect(T, T, W - 2 * T, H - 2 * T);
    // tegelvloer
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * T, T);
      ctx.lineTo(x * T, H - T);
      ctx.stroke();
    }
    for (let y = 1; y < ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(T, y * T);
      ctx.lineTo(W - T, y * T);
      ctx.stroke();
    }
    // rekken
    for (const [x0, y0, x1, y1] of REKKEN) {
      ctx.fillStyle = "#5a3e2b";
      roundRect(ctx, x0 * T + 2, y0 * T + 2, (x1 - x0 + 1) * T - 4, (y1 - y0 + 1) * T - 4, 5);
      ctx.fill();
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++)
          emoji(
            ctx,
            (x + y) % 3 === 0 ? "📦" : (x + y) % 3 === 1 ? "🗃️" : "🧹",
            (x + 0.5) * T,
            (y + 0.5) * T,
            16,
          );
    }
    // meterkast
    ctx.fillStyle = st.flits > 0 ? c.amber : "#2f3442";
    roundRect(ctx, KAST.x - 16, KAST.y - 16, 32, 32, 6);
    ctx.fill();
    emoji(ctx, "⚡", KAST.x, KAST.y, 20);
    // zekeringen
    for (const z of st.zekeringen)
      if (!z.pak) emoji(ctx, "🔋", z.x, z.y + Math.sin(t * 4 + z.x) * 2, 18);
    // ratten
    for (const r of st.ratten) emoji(ctx, "🐀", r.x, r.y, 18);
    // speler
    emoji(ctx, st.verlamd > 0 ? "😱" : "🧑‍🔧", st.px, st.py, 22);
    updateDeeltjes(ctx, st.deeltjes, dt);

    // duisternis met zaklamp
    if (st.flits <= 0) {
      const flikker = 1 + Math.sin(t * 23) * 0.015 + (Math.random() < 0.01 ? -0.15 : 0);
      const r = 95 * flikker;
      const g = ctx.createRadialGradient(st.px, st.py, r * 0.35, st.px, st.py, r);
      g.addColorStop(0, "rgba(6,6,16,0)");
      g.addColorStop(1, "rgba(6,6,16,0.96)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // meterkast-lampje blijft zichtbaar
      ctx.fillStyle = `rgba(255,200,60,${0.5 + 0.4 * Math.sin(t * 5)})`;
      ctx.beginPath();
      ctx.arc(KAST.x, KAST.y - 20, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      st.flits = Math.max(0.0001, st.flits - dt * 0.2);
    }
  });

  return (
    <div>
      <Hud>
        <HudPill tone={hud.tijd < 12 ? "bad" : "warn"}>⏱ {Math.ceil(hud.tijd)}s</HudPill>
        <HudPill tone="good">
          🔋 {hud.opgepakt}/{NODIG}
        </HudPill>
      </Hud>
      <TijdBalk fractie={hud.tijd / TIJD} />
      <SpelCanvas canvasRef={canvasRef} W={W} H={H} className="bg-ink" />
      <p className="mt-2 min-h-[1.5rem] text-sm font-semibold">{hud.bericht}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">⌨️ WASD of pijltjes · Shift = sneller</p>
        <PadKnoppen keys={keys} className="sm:hidden" />
      </div>
    </div>
  );
}
