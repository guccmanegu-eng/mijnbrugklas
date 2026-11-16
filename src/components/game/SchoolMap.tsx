import { useEffect, useRef, useState } from "react";
import { ALL_ROOMS } from "@/lib/game/data";
import { snd } from "@/lib/game/sound";
import { cn } from "@/lib/utils";
import { beweeg } from "./minigames/kit";

/* ========================================================================
 * Lokaalzoeker — loop met WASD / pijltjestoetsen door de schoolgangen
 * naar het juiste lokaal. Pak sterren voor bonus-XP onderweg.
 * ===================================================================== */

export const TILE = 26;
export const COLS = 27;
export const ROWS = 25;
const W = COLS * TILE;
const H = ROWS * TILE;

export const key = (x: number, y: number) => `${x},${y}`;

export type RoomDef = {
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
  { x: 3, w: 5, door: 4 },
  { x: 10, w: 6, door: 12 },
  { x: 18, w: 6, door: 20 },
];
const WINGS = [
  { rooms: ALL_ROOMS.A, corridor: 4, topY: 1, botY: 6 },
  { rooms: ALL_ROOMS.B, corridor: 12, topY: 9, botY: 14 },
  { rooms: ALL_ROOMS.C, corridor: 20, topY: 17, botY: 22 },
];

export const ROOMS: RoomDef[] = WINGS.flatMap((wing) =>
  ROOM_COLS.flatMap((col, i) => [
    {
      code: wing.rooms[i]!,
      x: col.x,
      y: wing.topY,
      w: col.w,
      h: 2,
      doorX: col.door,
      doorY: wing.corridor - 1,
      corridorY: wing.corridor,
    },
    {
      code: wing.rooms[i + 3]!,
      x: col.x,
      y: wing.botY,
      w: col.w,
      h: 2,
      doorX: col.door,
      doorY: wing.corridor + 1,
      corridorY: wing.corridor,
    },
  ]),
);

/* Begaanbare tegels: gangen, hallen, deuren en lokalen */
export const WALKABLE = new Set<string>();
for (const y of [4, 12, 20]) for (let x = 1; x <= 25; x++) WALKABLE.add(key(x, y));
for (const x of [1, 25]) for (let y = 4; y <= 20; y++) WALKABLE.add(key(x, y));
for (const r of ROOMS) {
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) WALKABLE.add(key(x, y));
  WALKABLE.add(key(r.doorX, r.doorY));
}

export const STAR_TILES: [number, number][] = [
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

const sndStar = snd.ster;
const sndGoed = snd.goed;
const sndFout = snd.fout;

/** Elke 3 echte seconden lopen = 1 minuut speltijd. */
const SEC_PER_MIN = 3;
const STRAF_MIN = 3;

export type Npc = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  e: string;
  conc?: boolean;
  min: number;
  max: number;
  as: "x" | "y";
  /** blijft even staan als jij eraan komt */
  wacht?: number;
  /** stapt opzij (loodrecht op de looprichting), in dezelfde eenheid als x/y */
  zij?: number;
};

/**
 * Medeleerlingen lopen niet meer tegen je aan: komt de speler dichtbij,
 * dan blijven ze even staan en stappen ze opzij. Geen botsingen meer.
 */
export function updateNpc(n: Npc, dt: number, spelerX: number, spelerY: number, dichtbij: number, opzij: number) {
  const d = Math.hypot(n.x - spelerX, n.y - spelerY);
  if (!n.conc && d < dichtbij) n.wacht = 0.6;
  n.wacht = Math.max(0, (n.wacht ?? 0) - dt);
  // opzij stappen, weg van de speler
  const doelZij = n.wacht > 0 ? (n.as === "x" ? (spelerY > n.y ? -opzij : opzij) : spelerX > n.x ? -opzij : opzij) : 0;
  n.zij = (n.zij ?? 0) + (doelZij - (n.zij ?? 0)) * Math.min(1, dt * 8);
  if (n.wacht > 0) return d;
  if (n.as === "x") {
    n.x += n.vx * dt;
    if (n.x < n.min || n.x > n.max) n.vx *= -1;
  } else {
    n.y += n.vy * dt;
    if (n.y < n.min || n.y > n.max) n.vy *= -1;
  }
  return d;
}

/** Waar de NPC getekend wordt (incl. opzij-stap). */
export const npcPos = (n: Npc) =>
  n.as === "x" ? { x: n.x, y: n.y + (n.zij ?? 0) } : { x: n.x + (n.zij ?? 0), y: n.y };

export function maakNpcs(): Npc[] {
  const e = ["🧑", "👧", "🧒", "👦", "👩‍🦱", "🧑‍🦰"];
  const gang = (y: number, x: number, v: number, i: number): Npc => ({
    x: (x + 0.5) * TILE,
    y: (y + 0.5) * TILE,
    vx: v,
    vy: 0,
    e: e[i % e.length]!,
    min: 1.5 * TILE,
    max: 24.5 * TILE,
    as: "x",
  });
  const hal = (x: number, y: number, v: number, i: number): Npc => ({
    x: (x + 0.5) * TILE,
    y: (y + 0.5) * TILE,
    vx: 0,
    vy: v,
    e: e[i % e.length]!,
    min: 4.5 * TILE,
    max: 20.5 * TILE,
    as: "y",
  });
  return [
    gang(4, 8, 55, 0),
    gang(4, 18, -45, 1),
    gang(12, 4, 50, 2),
    gang(12, 20, -60, 3),
    gang(20, 10, 45, 4),
    gang(20, 16, -50, 5),
    hal(1, 9, 40, 1),
    hal(25, 15, -45, 3),
    { ...gang(12, 13, 30, 0), e: "🧑‍🔧", conc: true },
  ];
}

export type Aankomst = { minutenOnderweg: number; fouten: number; seconden: number };

type Props = {
  target: string; // lokaalcode zoals de speler die kent
  echtLokaal?: string; // waar de les écht is (roosterwijziging)
  vakNaam: string;
  vakIcon: string;
  minutenOver: number;
  startLokaal: string;
  onArrive: (lokaal: string, info: Aankomst) => void;
  onStar: () => void;
};

export function SchoolMapGame({ target: startTarget, echtLokaal, vakNaam, vakIcon, minutenOver, startLokaal, onArrive, onStar }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sterren, setSterren] = useState(0);
  const [hint, setHint] = useState("➡️");
  const [aangekomen, setAangekomen] = useState<string | null>(null);
  const [target, setTarget] = useState(startTarget);
  const [klok, setKlok] = useState({ min: 0, fouten: 0 });
  const [bericht, setBericht] = useState<{ tekst: string; tone: "bad" | "warn" | "good" } | null>(null);
  const echt = echtLokaal ?? startTarget;

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
  const npcs = useRef<Npc[]>(maakNpcs());
  const run = useRef({ sec: 0, fouten: 0, stun: 0, laatsteKamer: "", rennenStraf: 0, target: startTarget, berichtTijd: 0 });
  const meld = (tekst: string, tone: "bad" | "warn" | "good") => {
    setBericht({ tekst, tone });
    run.current.berichtTijd = 2.6;
  };

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
    let lastMin = -1;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;

      const rs = run.current;
      const doelKamer = ROOMS.find((r) => r.code === rs.target) ?? ROOMS[0]!;

      /* --- klok --- */
      if (!done.current) {
        rs.sec += dt;
        rs.stun = Math.max(0, rs.stun - dt);
        rs.rennenStraf = Math.max(0, rs.rennenStraf - dt);
        if (rs.berichtTijd > 0) {
          rs.berichtTijd -= dt;
          if (rs.berichtTijd <= 0) setBericht(null);
        }
        const min = 1 + Math.floor(rs.sec / SEC_PER_MIN) + rs.fouten * STRAF_MIN;
        if (min !== lastMin) {
          lastMin = min;
          setKlok({ min, fouten: rs.fouten });
        }
      }

      /* --- NPC's in de gang --- */
      for (const n of npcs.current) {
        const d = updateNpc(n, dt, pos.current.x, pos.current.y, 42, 8);
        if (done.current) continue;
        if (n.conc && d < 60 && keys.current.has("run") && rs.rennenStraf <= 0) {
          rs.rennenStraf = 5;
          rs.sec += SEC_PER_MIN;
          snd.bots();
          meld("🧑‍🔧 Conciërge: 'Niet rennen in de gang!' (+1 min)", "warn");
        }
      }

      /* --- bewegen --- */
      if (!done.current && rs.stun <= 0) {
        let dx = 0;
        let dy = 0;
        if (keys.current.has("up")) dy -= 1;
        if (keys.current.has("down")) dy += 1;
        if (keys.current.has("left")) dx -= 1;
        if (keys.current.has("right")) dx += 1;
        if (dx || dy) {
          const snelheid = keys.current.has("run") ? 200 : 125;
          beweeg(pos.current, dx, dy, snelheid * dt, TILE, kanStaan);
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
        let inKamer: RoomDef | null = null;
        for (const r of ROOMS) {
          if (px > r.x * TILE + 6 && px < (r.x + r.w) * TILE - 6 && py > r.y * TILE + 6 && py < (r.y + r.h) * TILE - 6) {
            inKamer = r;
            break;
          }
        }
        if (!inKamer) rs.laatsteKamer = "";
        else if (inKamer.code !== rs.laatsteKamer) {
          rs.laatsteKamer = inKamer.code;
          const r = inKamer;
          const terugNaarGang = () => {
            pos.current.x = (r.doorX + 0.5) * TILE;
            pos.current.y = (r.corridorY + 0.5) * TILE;
            rs.laatsteKamer = "";
          };
          if (r.code === echt) {
            done.current = r.code;
            setAangekomen(r.code);
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
            const info: Aankomst = {
              minutenOnderweg: 1 + Math.floor(rs.sec / SEC_PER_MIN) + rs.fouten * STRAF_MIN,
              fouten: rs.fouten,
              seconden: Math.round(rs.sec),
            };
            window.setTimeout(() => cbs.current.onArrive(r.code, info), 800);
          } else if (r.code === rs.target) {
            // roosterwijziging gemist: lokaal is leeg
            rs.fouten++;
            rs.target = echt;
            setTarget(echt);
            sndFout();
            meld(`📝 Leeg lokaal! Briefje op de deur: "Les verplaatst naar ${echt}". (+${STRAF_MIN} min)`, "bad");
            terugNaarGang();
          } else {
            rs.fouten++;
            sndFout();
            meld(`😅 Oeps, dit is ${r.code}! Verkeerd lokaal (+${STRAF_MIN} min).`, "bad");
            terugNaarGang();
          }
        }
      }

      /* --- richtinghint --- */
      if (!done.current) {
        const tx = (doelKamer.doorX + 0.5) * TILE;
        const ty = (doelKamer.corridorY + 0.5) * TILE;
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
        const isTarget = r.code === rs.target;
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
        const isTarget = r.code === rs.target;
        ctx.fillStyle = isTarget ? kleur.mint : kleur.brand;
        ctx.globalAlpha = isTarget ? 0.9 : 0.45;
        ctx.fillRect(r.doorX * TILE + 3, r.doorY * TILE + 3, TILE - 6, TILE - 6);
        ctx.globalAlpha = 1;
      }

      /* puls + pijl boven de doeldeur */
      const dcx = (doelKamer.doorX + 0.5) * TILE;
      const dcy = (doelKamer.corridorY + 0.5) * TILE;
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

      /* medeleerlingen + conciërge */
      for (const n of npcs.current) {
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.beginPath();
        const np = npcPos(n);
        ctx.ellipse(np.x, np.y + 8, 8, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = n.conc ? "20px serif" : "18px serif";
        ctx.fillText(n.e, np.x, np.y + Math.sin(t * 10 + n.x) * 1.2);
      }

      /* speler */
      const bob = keys.current.size && !done.current ? Math.sin(t * 12) * 2 : 0;
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(px, py + 9, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      if (rs.stun > 0) {
        ctx.font = "13px serif";
        ctx.fillText("💫", px + 10, py - 16);
      }
      ctx.font = "22px serif";
      ctx.fillText("🧑‍🎓", px, py + bob);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTarget, startLokaal, echt]);

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
        <span
          className={cn(
            "rounded-full px-3 py-1 tabular-nums",
            minutenOver - klok.min < 0 ? "bg-rose/15 text-rose" : minutenOver - klok.min <= 1 ? "bg-amber/20 text-amber" : "bg-secondary",
          )}
        >
          {minutenOver - klok.min >= 0 ? `⏱ nog ${minutenOver - klok.min} min` : `⏰ ${klok.min - minutenOver} min te laat!`}
        </span>
        <span className="rounded-full bg-amber/20 px-3 py-1 text-amber">⭐ {sterren}/{STAR_TILES.length}</span>
        {klok.fouten ? <span className="rounded-full bg-rose/15 px-3 py-1 text-rose">❌ {klok.fouten}× fout</span> : null}
        {!aangekomen ? (
          <span className="rounded-full bg-brand/12 px-3 py-1 text-brand">Loop {hint}</span>
        ) : (
          <span className="rounded-full bg-mint/15 px-3 py-1 text-mint">🎉 Gevonden!</span>
        )}
      </div>
      <p
        className={cn(
          "mb-2 min-h-[1.25rem] text-sm font-semibold",
          bericht?.tone === "bad" ? "text-rose" : bericht?.tone === "warn" ? "text-amber" : "text-muted-foreground",
        )}
      >
        {bericht?.tekst ?? "Elke 3 seconden lopen kost 1 minuut. Een verkeerd lokaal kost extra tijd!"}
      </p>

      {/* Speelveld */}
      <div className="overflow-hidden rounded-2xl border-2 border-border">
        <canvas ref={canvasRef} className="block h-auto w-full" style={{ aspectRatio: `${W} / ${H}` }} />
      </div>

      {/* Knoppen voor tablets/telefoons */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          ⌨️ WASD of pijltjes = lopen · Shift = rennen (pas op voor de conciërge 🧑‍🔧)
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
