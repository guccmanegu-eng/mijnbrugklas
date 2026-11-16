import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";
import type { MiniResult } from "@/lib/game/events";

/* ========================================================================
 * Gedeelde bouwstenen voor alle minigames.
 * ===================================================================== */

export type GameProps = { onKlaar: (r: MiniResult) => void };

export type Kleuren = {
  ink: string;
  paper: string;
  card: string;
  secondary: string;
  brand: string;
  mint: string;
  amber: string;
  rose: string;
  muted: string;
};

export function themaKleuren(): Kleuren {
  if (typeof document === "undefined")
    return {
      ink: "#23233f",
      paper: "#f7f6fb",
      card: "#ffffff",
      secondary: "#eef0f6",
      brand: "#3540b0",
      mint: "#3fae6a",
      amber: "#e0a32e",
      rose: "#d33363",
      muted: "#7a809a",
    };
  const css = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
  return {
    ink: v("--ink", "#23233f"),
    paper: v("--paper", "#f7f6fb"),
    card: v("--card", "#ffffff"),
    secondary: v("--secondary", "#eef0f6"),
    brand: v("--brand", "#3540b0"),
    mint: v("--mint", "#3fae6a"),
    amber: v("--amber", "#e0a32e"),
    rose: v("--rose", "#d33363"),
    muted: v("--muted-foreground", "#7a809a"),
  };
}

export type Richting = "up" | "down" | "left" | "right" | "run" | "actie";

/** Houdt bij welke toetsen ingedrukt zijn (WASD, pijltjes, Shift, spatie). */
export function useToetsen(actief = true) {
  const keys = useRef<Set<Richting>>(new Set());
  useEffect(() => {
    if (!actief) return;
    const map = (k: string): Richting | null => {
      const l = k.toLowerCase();
      if (l === "arrowup" || l === "w") return "up";
      if (l === "arrowdown" || l === "s") return "down";
      if (l === "arrowleft" || l === "a") return "left";
      if (l === "arrowright" || l === "d") return "right";
      if (l === "shift") return "run";
      if (l === " " || l === "enter") return "actie";
      return null;
    };
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
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
  }, [actief]);
  return keys;
}

/**
 * Start een requestAnimationFrame-loop op een canvas met vaste logische maat.
 * `frame` wordt elke render ververst, dus mag React-state lezen via refs.
 */
export function useCanvasLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  W: number,
  H: number,
  frame: (ctx: CanvasRenderingContext2D, dt: number, t: number) => void,
) {
  const frameRef = useRef(frame);
  frameRef.current = frame;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      try {
        frameRef.current(ctx, dt, now / 1000);
      } catch (e) {
        console.error(e);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [canvasRef, W, H]);
}

/** Zet een pointer-event om naar logische canvas-coördinaten. */
export function canvasPunt(
  e: { clientX: number; clientY: number },
  canvas: HTMLCanvasElement,
  W: number,
  H: number,
) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

export type Deeltje = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  kleur: string;
  size?: number;
};

export function spawnDeeltjes(
  lijst: Deeltje[],
  x: number,
  y: number,
  n: number,
  kleuren: string[],
  kracht = 180,
) {
  for (let i = 0; i < n; i++) {
    lijst.push({
      x,
      y,
      vx: (Math.random() - 0.5) * kracht,
      vy: (Math.random() - 0.5) * kracht - kracht * 0.3,
      life: 0.5 + Math.random() * 0.5,
      kleur: kleuren[i % kleuren.length]!,
      size: 3 + Math.random() * 4,
    });
  }
}

export function updateDeeltjes(
  ctx: CanvasRenderingContext2D,
  lijst: Deeltje[],
  dt: number,
  zwaarte = 320,
) {
  for (let i = lijst.length - 1; i >= 0; i--) {
    const p = lijst[i]!;
    p.life -= dt;
    if (p.life <= 0) {
      lijst.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += zwaarte * dt;
    ctx.globalAlpha = Math.min(1, p.life * 1.6);
    ctx.fillStyle = p.kleur;
    const s = p.size ?? 5;
    ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
}

export function emoji(
  ctx: CanvasRenderingContext2D,
  e: string,
  x: number,
  y: number,
  size: number,
  alpha = 1,
) {
  ctx.globalAlpha = alpha;
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(e, x, y);
  ctx.globalAlpha = 1;
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ---------- UI-stukjes ---------- */

export function Hud({ children }: { children: ReactNode }) {
  return <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-bold">{children}</div>;
}

export function HudPill({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: "muted" | "good" | "warn" | "bad" | "brand";
  className?: string;
}) {
  const tones = {
    muted: "bg-secondary text-secondary-foreground",
    good: "bg-mint/15 text-mint",
    warn: "bg-amber/20 text-amber",
    bad: "bg-rose/15 text-rose",
    brand: "bg-brand/12 text-brand",
  } as const;
  return (
    <span className={cn("rounded-full px-3 py-1 tabular-nums", tones[tone], className)}>
      {children}
    </span>
  );
}

export function TijdBalk({ fractie, className }: { fractie: number; className?: string }) {
  const f = Math.max(0, Math.min(1, fractie));
  return (
    <div className={cn("mb-3 h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-200",
          f < 0.25 ? "bg-rose" : f < 0.5 ? "bg-amber" : "bg-mint",
        )}
        style={{ width: `${f * 100}%` }}
      />
    </div>
  );
}

export function SpelCanvas({
  canvasRef,
  W,
  H,
  className,
  ...rest
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  W: number;
  H: number;
  className?: string;
} & React.CanvasHTMLAttributes<HTMLCanvasElement>) {
  return (
    <div
      className={cn("overflow-hidden rounded-2xl border-2 border-border bg-secondary", className)}
    >
      <canvas
        ref={canvasRef}
        className="block h-auto w-full touch-none select-none"
        style={{ aspectRatio: `${W} / ${H}` }}
        {...rest}
      />
    </div>
  );
}

/** Touch-knoppen voor telefoons/tablets. */
export function PadKnoppen({
  keys,
  richtingen = ["up", "left", "down", "right"],
  className,
}: {
  keys: RefObject<Set<Richting>>;
  richtingen?: Richting[];
  className?: string;
}) {
  const label: Record<Richting, string> = {
    up: "⬆️",
    down: "⬇️",
    left: "⬅️",
    right: "➡️",
    run: "🏃",
    actie: "🅰️",
  };
  const knop = (r: Richting) => (
    <button
      key={r}
      type="button"
      aria-label={r}
      className="flex h-14 w-14 touch-none items-center justify-center rounded-2xl border-2 border-border bg-card text-xl shadow-sm select-none active:scale-95 active:border-brand active:bg-brand/10"
      onPointerDown={(e) => {
        e.preventDefault();
        keys.current?.add(r);
      }}
      onPointerUp={() => keys.current?.delete(r)}
      onPointerLeave={() => keys.current?.delete(r)}
      onPointerCancel={() => keys.current?.delete(r)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label[r]}
    </button>
  );
  const heeftVier = richtingen.includes("up") && richtingen.includes("down");
  if (heeftVier)
    return (
      <div className={cn("grid grid-cols-3 gap-1.5", className)}>
        <span />
        {knop("up")}
        <span />
        {knop("left")}
        {knop("down")}
        {knop("right")}
      </div>
    );
  return <div className={cn("flex gap-2", className)}>{richtingen.map(knop)}</div>;
}

export const shuffle = <T,>(a: readonly T[]) => {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j] as T, c[i] as T];
  }
  return c;
};

export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Beweeg een rond figuurtje over een tegelraster met botsing én "hoek-glijden":
 * loop je net naast een opening, dan schuif je er vanzelf in.
 */
export function beweeg(
  p: { x: number; y: number },
  dx: number,
  dy: number,
  stap: number,
  T: number,
  kanStaan: (x: number, y: number) => boolean,
) {
  const len = Math.hypot(dx, dy) || 1;
  const nx = p.x + (dx / len) * stap;
  const ny = p.y + (dy / len) * stap;
  const zoekLaan = (pos: number, vast: (c: number) => boolean) => {
    const basis = Math.floor(pos / T);
    let beste: number | null = null;
    for (const r of [basis, basis - 1, basis + 1]) {
      const c = (r + 0.5) * T;
      if (Math.abs(c - pos) > T * 0.8 || !vast(c)) continue;
      if (beste === null || Math.abs(c - pos) < Math.abs(beste - pos)) beste = c;
    }
    return beste;
  };
  if (dx) {
    if (kanStaan(nx, p.y)) p.x = nx;
    else if (!dy) {
      const c = zoekLaan(p.y, (cy) => kanStaan(p.x + Math.sign(dx) * stap, cy));
      if (c !== null) {
        const d = Math.sign(c - p.y) * Math.min(Math.abs(c - p.y), stap);
        if (kanStaan(p.x, p.y + d)) p.y += d;
      }
    }
  }
  if (dy) {
    if (kanStaan(p.x, ny)) p.y = ny;
    else if (!dx) {
      const c = zoekLaan(p.x, (cx) => kanStaan(cx, p.y + Math.sign(dy) * stap));
      if (c !== null) {
        const d = Math.sign(c - p.x) * Math.min(Math.abs(c - p.x), stap);
        if (kanStaan(p.x + d, p.y)) p.x += d;
      }
    }
  }
}
