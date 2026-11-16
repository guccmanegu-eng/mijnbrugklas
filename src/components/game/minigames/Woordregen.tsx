import { useRef, useState } from "react";
import { snd } from "@/lib/game/sound";
import {
  Hud,
  HudPill,
  SpelCanvas,
  TijdBalk,
  clamp01,
  roundRect,
  shuffle,
  spawnDeeltjes,
  themaKleuren,
  updateDeeltjes,
  useCanvasLoop,
  type Deeltje,
  type GameProps,
} from "./kit";

/* ========================================================================
 * Woordenregen: Nederlandse woorden vallen naar beneden, typ snel de
 * Engelse vertaling voordat ze de grond raken.
 * ===================================================================== */

const W = 520;
const H = 380;
const TIJD = 60;
const LEVENS = 3;

const WOORDEN: [string, string[]][] = [
  ["huiswerk", ["homework"]],
  ["docent", ["teacher"]],
  ["lokaal", ["classroom"]],
  ["pauze", ["break"]],
  ["toets", ["test", "exam"]],
  ["boek", ["book"]],
  ["pen", ["pen"]],
  ["fiets", ["bike", "bicycle"]],
  ["vriend", ["friend"]],
  ["rooster", ["timetable", "schedule"]],
  ["school", ["school"]],
  ["vergeten", ["forget", "to forget", "forgotten"]],
  ["leren", ["learn", "study", "to learn"]],
  ["lezen", ["read", "to read"]],
  ["schrijven", ["write", "to write"]],
  ["klas", ["class"]],
  ["kluisje", ["locker"]],
  ["etui", ["pencil case"]],
  ["gum", ["eraser", "rubber"]],
  ["liniaal", ["ruler"]],
  ["vandaag", ["today"]],
  ["morgen", ["tomorrow"]],
  ["gisteren", ["yesterday"]],
  ["snel", ["fast", "quick", "quickly"]],
  ["moe", ["tired"]],
  ["blij", ["happy", "glad"]],
  ["kantine", ["canteen", "cafeteria"]],
  ["vraag", ["question"]],
  ["antwoord", ["answer"]],
  ["woordenboek", ["dictionary"]],
];

type Valler = { nl: string; en: string[]; x: number; y: number; v: number };

export function Woordregen({ onKlaar }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const kleur = useRef(themaKleuren());
  const [invoer, setInvoer] = useState("");
  const [hud, setHud] = useState({ tijd: TIJD, punten: 0, levens: LEVENS, combo: 0 });
  const [laatsteFout, setLaatsteFout] = useState<string | null>(null);
  const s = useRef({
    tijd: TIJD,
    vallers: [] as Valler[],
    pool: shuffle(WOORDEN),
    poolI: 0,
    spawn: 0.5,
    punten: 0,
    goed: 0,
    levens: LEVENS,
    combo: 0,
    deeltjes: [] as Deeltje[],
    flits: 0,
    klaar: false,
    hudTimer: 0,
  });

  const eindig = () => {
    const st = s.current;
    if (st.klaar) return;
    st.klaar = true;
    snd.gong();
    window.setTimeout(
      () =>
        onKlaar({
          score: clamp01(st.goed / 14),
          punten: st.punten,
          tekst: `Je typte ${st.goed} woorden goed${st.levens <= 0 ? " voordat de regen te hard werd" : ""}.`,
        }),
      800,
    );
  };

  const controleer = (tekst: string) => {
    const st = s.current;
    const t = tekst.trim().toLowerCase();
    if (!t) return false;
    // laagste (meest urgente) woord eerst
    const kandidaten = [...st.vallers].sort((a, b) => b.y - a.y);
    const hit = kandidaten.find((v) => v.en.includes(t));
    if (!hit) return false;
    st.vallers = st.vallers.filter((v) => v !== hit);
    st.combo++;
    st.goed++;
    const p = 10 + Math.min(st.combo, 8) * 2 + Math.round((1 - hit.y / H) * 10);
    st.punten += p;
    snd.combo(st.combo);
    spawnDeeltjes(st.deeltjes, hit.x, hit.y, 14, [kleur.current.mint, kleur.current.brand], 180);
    return true;
  };

  useCanvasLoop(canvasRef, W, H, (ctx, dt, t) => {
    const st = s.current;
    const c = kleur.current;
    if (!st.klaar) {
      st.tijd -= dt;
      if (st.tijd <= 0 || st.levens <= 0) {
        st.tijd = Math.max(0, st.tijd);
        eindig();
      }
      const voortgang = 1 - st.tijd / TIJD;
      st.spawn -= dt;
      if (st.spawn <= 0 && st.vallers.length < 5) {
        st.spawn = 2.6 - voortgang * 1.4;
        const w = st.pool[st.poolI % st.pool.length]!;
        st.poolI++;
        st.vallers.push({
          nl: w[0],
          en: w[1],
          x: 70 + Math.random() * (W - 140),
          y: -10,
          v: 22 + voortgang * 34,
        });
      }
      for (const v of [...st.vallers]) {
        v.y += v.v * dt;
        if (v.y > H - 34) {
          st.vallers = st.vallers.filter((x) => x !== v);
          st.levens--;
          st.combo = 0;
          st.flits = 0.4;
          snd.fout();
          setLaatsteFout(`${v.nl} = ${v.en[0]}`);
        }
      }
      st.hudTimer += dt;
      if (st.hudTimer > 0.15) {
        st.hudTimer = 0;
        setHud({ tijd: st.tijd, punten: st.punten, levens: st.levens, combo: st.combo });
      }
    }

    /* tekenen */
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#5b6b8c");
    g.addColorStop(1, "#a8b8d0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // regendruppels
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 40; i++) {
      const x = (i * 53 + t * 40) % W;
      const y = (i * 97 + t * 420) % H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y + 12);
      ctx.stroke();
    }
    // grond
    ctx.fillStyle = st.flits > 0 ? c.rose : "#4f7a4a";
    st.flits = Math.max(0, st.flits - dt);
    ctx.fillRect(0, H - 30, W, 30);
    // woorden als paraplu-wolkjes
    for (const v of st.vallers) {
      ctx.font = "bold 18px ui-sans-serif, system-ui";
      const tw = ctx.measureText(v.nl).width + 26;
      const gevaar = v.y > H * 0.65;
      ctx.fillStyle = gevaar ? "#ffe4e6" : "#ffffff";
      roundRect(ctx, v.x - tw / 2, v.y - 16, tw, 32, 14);
      ctx.fill();
      ctx.strokeStyle = gevaar ? c.rose : c.brand;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#1f2440";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(v.nl, v.x, v.y + 1);
      ctx.font = "16px serif";
      ctx.fillText("☂️", v.x, v.y - 28);
    }
    updateDeeltjes(ctx, st.deeltjes, dt);
  });

  return (
    <div>
      <Hud>
        <HudPill tone={hud.tijd < 10 ? "bad" : "warn"}>⏱ {Math.ceil(hud.tijd)}s</HudPill>
        <HudPill tone="brand">⭐ {hud.punten}</HudPill>
        <HudPill tone="bad">
          {"❤️".repeat(Math.max(0, hud.levens))}
          {"🖤".repeat(Math.max(0, LEVENS - hud.levens))}
        </HudPill>
        {hud.combo >= 3 ? <HudPill tone="good">🔥 ×{hud.combo}</HudPill> : null}
      </Hud>
      <TijdBalk fractie={hud.tijd / TIJD} />
      <SpelCanvas
        canvasRef={canvasRef}
        W={W}
        H={H}
        onPointerDown={() => inputRef.current?.focus()}
      />
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (controleer(invoer)) setInvoer("");
          else {
            snd.bots();
            inputRef.current?.classList.add("animate-shake");
            window.setTimeout(() => inputRef.current?.classList.remove("animate-shake"), 400);
          }
        }}
      >
        <input
          ref={inputRef}
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={invoer}
          onChange={(e) => {
            const v = e.target.value;
            // automatisch goed rekenen zodra het woord klopt
            if (controleer(v)) setInvoer("");
            else setInvoer(v);
          }}
          placeholder="Typ de Engelse vertaling…"
          className="min-w-0 flex-1 rounded-2xl border-2 bg-card px-4 py-3 text-lg font-bold outline-none focus:border-brand"
        />
        <button className="rounded-2xl bg-brand px-5 font-bold text-primary-foreground">↵</button>
      </form>
      <p className="mt-2 min-h-[1.25rem] text-xs text-muted-foreground">
        {laatsteFout
          ? `💧 Gemist: ${laatsteFout}`
          : "Tip: het onderste woord wordt als eerste gecontroleerd."}
      </p>
    </div>
  );
}
