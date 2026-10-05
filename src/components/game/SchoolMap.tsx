import { useEffect, useRef, useState } from "react";
import { ALL_ROOMS } from "@/lib/game/data";
import { cn } from "@/lib/utils";

/* ========================================================================
 * Lokaalzoeker — loop met WASD / pijltjestoetsen door de schoolgangen
 * naar het juiste lokaal. Pak sterren voor bonus-XP onderweg.
 * ===================================================================== */

const TILE = 26;
const COLS = 27;
const ROWS = 25;
const W = COLS * TILE;
const H = ROWS * TILE;

const key = (x: number, y: number) => `${x},${y}`;

type RoomDef = {
  code: string;
  x: number;
  y: number;
  w: number;
  h: number;
  doorX: number;
  doorY: number;
  corridorY: number;
};

/* Kamers per vleugel: 3 boven de gang, 3 eronder */
const ROOM_COLS = [
  { x: 2, door: 4 },
  { x: 10, door: 12 },
  { x: 18, door: 20 },
];
const WINGS = [
  { rooms: ALL_ROOMS.A, corridor: 4, topY: 1, botY: 6 },
  { rooms: ALL_ROOMS.B, corridor: 12, topY: 9, botY: 14 },
  { rooms: ALL_ROOMS.C, corridor: 20, topY: 17, botY: 22 },
];

const ROOMS: RoomDef[] = WINGS.flatMap((wing) =>
  ROOM_COLS.flatMap((col, i) => [
    {
      code: wing.rooms[i]!,
      x: col.x,
      y: wing.topY,
      w: 6,
      h: 2,
      doorX: col.door,
      doorY: wing.corridor - 1,
      corridorY: wing.corridor,
    },
    {
      code: wing.rooms[i + 3]!,
      x: col.x,
      y: wing.botY,
      w: 6,
      h: 2,
      doorX: col.door,
      doorY: wing.corridor + 1,
      corridorY: wing.corridor,
    },
  ]),
);

/* Begaanbare tegels: gangen, hallen, deuren en lokalen */
const WALKABLE = new Set<string>();
for (const y of [4, 12, 20]) for (let x = 1; x <= 25; x++) WALKABLE.add(key(x, y));
for (const x of [1, 25]) for (let y = 4; y <= 20; y++) WALKABLE.add(key(x, y));
for (const r of ROOMS) {
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) WALKABLE.add(key(x, y));
  WALKABLE.add(key(r.doorX, r.doorY));
}

const STAR_TILES: [number, number][] = [
  [6, 4],
  [21, 4],
  [8, 12],
  [19, 12],
  [25, 10],
  [13, 20],
];

const DIRS: [string, number][] = [
  ["➡️", 0],
  ["↘️", 45],
  ["⬇️", 90],
  ["↙️", 135],
  ["⬅️", 180],
  ["↖️", 225],
  ["⬆️", 270],
  ["↗️", 315],
];

/* ---- kleine geluidjes (WebAudio, geen bestanden nodig) ---- */
let actx: AudioContext | null = null;
function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.07, delay = 0) {
  try {
    actx ??= new AudioContext();
    const t0 = actx.currentTime + delay;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(actx.destination);
    o.start(t0);
    o.stop(t0 + dur);
  } catch {
    /* geen geluid beschikbaar */
  }
}
const sndStar = () => {
  tone(880, 0.1);
  tone(1318, 0.12, "sine", 0.07, 0.08);
};
const sndGoed = () => {
  tone(523, 0.14);
  tone(659, 0.14, "sine", 0.07, 0.12);
  tone(784, 0.22, "sine", 0.08, 0.24);
};
const sndFout = () => tone(170, 0.3, "sawtooth", 0.05);

type Props = {
  target: string; // lokaalcode van de volgende les
  vakNaam: string;
  vakIcon: string;
  minutenOver: number;
  startLokaal: string;
  onArrive: (lokaal: string) => void;
  onStar: () => void;
};

export function SchoolMapGame({ target, vakNaam, vakIcon, minutenOver, startLokaal, onArrive, onStar }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sterren, setSterren] = useState(0);
  const [hint, setHint] = useState("➡️");
  const [aangekomen, setAangekomen] = useState<string | null>(null);

  const targetRoom = ROOMS.find((r) => r.code === target) ?? ROOMS[0]!;
  const startRoom = ROOMS.find((r) => r.code === startLokaal);
  const startX = startRoom ? (startRoom.doorX + 0.5) * TILE : 13.5 * TILE;
  const startY = startRoom ? (startRoom.corridorY + 0.5) * TILE : 20.5 * TILE;

  const pos = useRef({ x: startX, y: startY });
  const keys = useRef<Set<string>>(new Set());
  const gotStars = useRef<Set<string>>(new Set());
  const particles = useRef<{ x: number; y: number; vx: number; vy: number; life: number; kleur: string }[]>([]);
  const done = useRef<string | null>(null);
  const cbs = useRef({ onArrive, onStar });
  cbs.current = { onArrive, onStar };

  /* Toetsenbord: WASD + pijltjes, Shift = rennen */
  useEffect(() => {
    const map = (k: string) => {
      const l = k.toLowerCase();
      if (l === "arrowup" || l === "w") return "up";
      if (l === "arrowdown" || l === "s") return "down";
      if (l === "arrowleft" || l === "a") return "left";
      if (l === "arrowright" || l === "d") return "right";
      if (l === "shift") return "run";
      return null;
    };
    const down = (e: KeyboardEvent) => {
      const d = map(e.key);
      if (!d) return;
      e.preventDefault();
      keys.current.add(d);
    };
    const up = (e: KeyboardEvent) => {
      const d = map(e.key);
      if (d) keys.current.delete(d);
    };
    const clear = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);

  /* Spel-loop: bewegen, botsen, sterren pakken, tekenen */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const css = getComputedStyle(document.documentElement);
    const kleur = {
      muur: css.getPropertyValue("--ink").trim() || "#23233f",
      gang: css.getPropertyValue("--paper").trim() || "#f7f6fb",
      lokaal: css.getPropertyValue("--secondary").trim() || "#eef0f6",
      brand: css.getPropertyValue("--brand").trim() || "#3540b0",
      mint: css.getPropertyValue("--mint").trim() || "#3fae6a",
      amber: css.getPropertyValue("--amber").trim() || "#e0a32e",
      rose: css.getPropertyValue("--rose").trim() || "#d33363",
      tekst: css.getPropertyValue("--ink").trim() || "#23233f",
    };

    const R = 9; // spelerstraal
    const isWalk = (px: number, py: number) => WALKABLE.has(key(Math.floor(px / TILE), Math.floor(py / TILE)));
    const kanStaan = (px: number, py: number) =>
      isWalk(px - R, py - R) && isWalk(px + R, py - R) && isWalk(px - R, py + R) && isWalk(px + R, py + R);

    let raf = 0;
    let last = performance.now();
    let lastHint = "";

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;

      /* --- bewegen --- */
      if (!done.current) {
        let dx = 0;
        let dy = 0;
        if (keys.current.has("up")) dy -= 1;
        if (keys.current.has("down")) dy += 1;
        if (keys.current.has("left")) dx -= 1;
        if (keys.current.has("right")) dx += 1;
        if (dx || dy) {
          const len = Math.hypot(dx, dy);
          const snelheid = keys.current.has("run") ? 200 : 125;
          const nx = pos.current.x + (dx / len) * snelheid * dt;
          const ny = pos.current.y + (dy / len) * snelheid * dt;
          if (kanStaan(nx, pos.current.y)) pos.current.x = nx;
          if (kanStaan(pos.current.x, ny)) pos.current.y = ny;
        }
      }

      const px = pos.current.x;
      const py = pos.current.y;

      /* --- sterren pakken --- */
      for (const [sx, sy] of STAR_TILES) {
        const sk = key(sx, sy);
        if (gotStars.current.has(sk)) continue;
        const cx = (sx + 0.5) * TILE;
        const cy = (sy + 0.5) * TILE;
        if (Math.hypot(px - cx, py - cy) < 16) {
          gotStars.current.add(sk);
          setSterren(gotStars.current.size);
          sndStar();
          cbs.current.onStar();
          for (let i = 0; i < 10; i++) {
            particles.current.push({
              x: cx,
              y: cy,
              vx: (Math.random() - 0.5) * 120,
              vy: (Math.random() - 0.5) * 120 - 40,
              life: 0.6,
              kleur: kleur.amber,
            });
          }
        }
      }

      /* --- aankomst in een lokaal --- */
      if (!done.current) {
        for (const r of ROOMS) {
          if (px > r.x * TILE + 6 && px < (r.x + r.w) * TILE - 6 && py > r.y * TILE + 6 && py < (r.y + r.h) * TILE - 6) {
            done.current = r.code;
            setAangekomen(r.code);
            const goed = r.code === target;
            if (goed) {
              sndGoed();
              for (let i = 0; i < 42; i++) {
                particles.current.push({
                  x: px,
                  y: py,
                  vx: (Math.random() - 0.5) * 260,
                  vy: (Math.random() - 0.5) * 260 - 90,
                  life: 0.9,
                  kleur: [kleur.brand, kleur.mint, kleur.amber, kleur.rose][i % 4]!,
                });
              }
            } else {
              sndFout();
            }
            window.setTimeout(() => cbs.current.onArrive(r.code), goed ? 750 : 450);
            break;
          }
        }
      }

      /* --- richtinghint --- */
      if (!done.current) {
        const tx = (targetRoom.doorX + 0.5) * TILE;
        const ty = (targetRoom.corridorY + 0.5) * TILE;
        const hoek = ((Math.atan2(ty - py, tx - px) * 180) / Math.PI + 360) % 360;
        const d = DIRS.reduce((best, cur) => {
          const diff = Math.abs(((cur[1] - hoek + 540) % 360) - 180);
          const bestDiff = Math.abs(((best[1] - hoek + 540) % 360) - 180);
          return diff > bestDiff ? cur : best;
        })[0];
        if (d !== lastHint) {
          lastHint = d;
          setHint(d);
        }
      }

      /* --- deeltjes --- */
      particles.current = particles.current.filter((p) => (p.life -= dt) > 0);
      for (const p of particles.current) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 320 * dt;
      }

      /* ============ tekenen ============ */
      ctx.fillStyle = kleur.muur;
      ctx.fillRect(0, 0, W, H);

      /* gangen en hallen */
      ctx.fillStyle = kleur.gang;
      for (const k of WALKABLE) {
        const [x, y] = k.split(",").map(Number) as [number, number];
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }

      /* lokalen */
      for (const r of ROOMS) {
        const isTarget = r.code === target;
        ctx.fillStyle = isTarget ? kleur.mint : kleur.lokaal;
        ctx.globalAlpha = isTarget ? 0.35 + 0.15 * Math.sin(t * 4) : 1;
        ctx.fillRect(r.x * TILE, r.y * TILE, r.w * TILE, r.h * TILE);
        ctx.globalAlpha = 1;
        ctx.fillStyle = isTarget ? kleur.brand : kleur.tekst;
        ctx.font = `bold 12px ui-sans-serif, system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(r.code, (r.x + r.w / 2) * TILE, (r.y + r.h / 2) * TILE);
      }

      /* deuren */
      for (const r of ROOMS) {
        const isTarget = r.code === target;
        ctx.fillStyle = isTarget ? kleur.mint : kleur.brand;
        ctx.globalAlpha = isTarget ? 0.9 : 0.45;
        ctx.fillRect(r.doorX * TILE + 3, r.doorY * TILE + 3, TILE - 6, TILE - 6);
        ctx.globalAlpha = 1;
      }

      /* puls + pijl boven de doeldeur */
      const dcx = (targetRoom.doorX + 0.5) * TILE;
      const dcy = (targetRoom.corridorY + 0.5) * TILE;
      ctx.strokeStyle = kleur.mint;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 5);
      ctx.beginPath();
      ctx.arc(dcx, dcy, 12 + 3 * Math.sin(t * 5), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.font = "16px serif";
      ctx.fillText("🎯", dcx, dcy - 22 - 4 * Math.abs(Math.sin(t * 3)));

      /* sterren */
      for (const [sx, sy] of STAR_TILES) {
        if (gotStars.current.has(key(sx, sy))) continue;
        ctx.font = `${15 + 2 * Math.sin(t * 4 + sx)}px serif`;
        ctx.fillText("⭐", (sx + 0.5) * TILE, (sy + 0.5) * TILE);
      }

      /* deeltjes */
      for (const p of particles.current) {
        ctx.globalAlpha = Math.max(0, p.life * 1.4);
        ctx.fillStyle = p.kleur;
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      }
      ctx.globalAlpha = 1;

      /* speler */
      const bob = keys.current.size && !done.current ? Math.sin(t * 12) * 2 : 0;
      ctx.beginPath();
      ctx.arc(px, py + 6, 10, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fill();
      ctx.font = "22px serif";
      ctx.globalAlpha = 0.5;
      ctx.fillText("🧑‍🎓", px, py + bob);

      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, startLokaal]);

  const druk = (richting: string, aan: boolean) => {
    if (aan) keys.current.add(richting);
    else keys.current.delete(richting);
  };

  const padKnop = (richting: string, label: string, className: string) => (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex h-14 w-14 touch-none items-center justify-center rounded-2xl border-2 border-border bg-card text-xl shadow-sm select-none active:scale-95 active:border-brand active:bg-brand/10",
        className,
      )}
      onPointerDown={(e) => {
        e.preventDefault();
        druk(richting, true);
      }}
      onPointerUp={() => druk(richting, false)}
      onPointerLeave={() => druk(richting, false)}
      onPointerCancel={() => druk(richting, false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* HUD */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-bold">
        <span className="rounded-full bg-mint/15 px-3 py-1 text-mint">
          🎯 {target} · {vakIcon} {vakNaam}
        </span>
        <span className="rounded-full bg-secondary px-3 py-1">⏱ nog {Math.max(0, minutenOver)} min</span>
        <span className="rounded-full bg-amber/20 px-3 py-1 text-amber">⭐ {sterren}/{STAR_TILES.length}</span>
        {!aangekomen ? (
          <span className="rounded-full bg-brand/12 px-3 py-1 text-brand">Loop {hint}</span>
        ) : (
          <span className="rounded-full bg-mint/15 px-3 py-1 text-mint">
            {aangekomen === target ? "🎉 Gevonden!" : `😅 Dit is ${aangekomen}…`}
          </span>
        )}
      </div>

      {/* Speelveld */}
      <div className="overflow-hidden rounded-2xl border-2 border-border">
        <canvas ref={canvasRef} className="block h-auto w-full" style={{ aspectRatio: `${W} / ${H}` }} />
      </div>

      {/* Knoppen voor tablets/telefoons */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          ⌨️ WASD of pijltjes = lopen · Shift = rennen
          <span className="sm:hidden"> · of gebruik de knoppen</span>
        </p>
        <div className="grid grid-cols-3 gap-1.5 sm:hidden">
          <span />
          {padKnop("up", "⬆️", "")}
          <span />
          {padKnop("left", "⬅️", "")}
          {padKnop("down", "⬇️", "")}
          {padKnop("right", "➡️", "")}
        </div>
      </div>
    </div>
  );
}
