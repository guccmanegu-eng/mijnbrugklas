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
 * Brand-evacuatie: loop via de vluchtroute naar een nooduitgang.
 * Vuur verspreidt zich, rook maakt je trager, de lift is verboden terrein.
 * ===================================================================== */

const T = 24;
const COLS = 27;
const ROWS = 19;
const W = COLS * T;
const H = ROWS * T;
const TIJD = 50;

type Tegel = "muur" | "gang" | "lokaal" | "uitgang" | "lift";
const k = (x: number, y: number) => y * COLS + x;

function bouwKaart() {
  const g: Tegel[] = Array.from({ length: COLS * ROWS }, () => "muur");
  const rect = (x0: number, y0: number, x1: number, y1: number, t: Tegel) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[k(x, y)] = t;
  };
  // gangen
  rect(1, 5, 25, 6, "gang");
  rect(1, 12, 25, 13, "gang");
  rect(13, 5, 14, 17, "gang");
  rect(25, 5, 25, 13, "gang");
  // lokalen boven
  rect(1, 1, 5, 3, "lokaal");
  rect(7, 1, 11, 3, "lokaal");
  rect(16, 1, 20, 3, "lokaal");
  rect(22, 1, 24, 3, "lokaal");
  // lokalen midden
  rect(1, 8, 5, 10, "lokaal");
  rect(7, 8, 11, 10, "lokaal");
  rect(16, 8, 20, 10, "lokaal");
  rect(21, 8, 23, 10, "lokaal");
  g[k(20, 8)] = "lokaal";
  // lokalen onder
  rect(1, 15, 6, 17, "lokaal");
  rect(8, 15, 11, 17, "lokaal");
  rect(16, 15, 20, 17, "lokaal");
  rect(22, 15, 24, 17, "lokaal");
  // deuren
  for (const [x, y] of [
    [3, 4],
    [9, 4],
    [18, 4],
    [23, 4],
    [3, 7],
    [9, 7],
    [18, 7],
    [22, 11],
    [3, 11],
    [3, 14],
    [10, 14],
    [18, 14],
    [23, 14],
  ] as [number, number][])
    g[k(x, y)] = "lokaal";
  // lift-nis naast de middengang
  g[k(12, 7)] = "lift";
  // nooduitgangen (twee tegels breed)
  for (const [x, y] of [
    [0, 5],
    [0, 6],
    [26, 12],
    [26, 13],
    [13, 18],
    [14, 18],
  ] as [number, number][])
    g[k(x, y)] = "uitgang";
  return g;
}

/** Hier begint de brand. */
const START_VUUR: [number, number][] = [
  [21, 13],
  [22, 12],
  [23, 16],
];

const KAART = bouwKaart();
const begaanbaar = (x: number, y: number) => {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
  return KAART[k(x, y)] !== "muur";
};

/* afstand tot dichtstbijzijnde uitgang (voor de vluchtroute-pijlen),
 * met een ruime boog om de brandhaard heen: de veilige vluchtroute */
const bijVuur = (x: number, y: number) =>
  START_VUUR.some(([fx, fy]) => Math.abs(fx - x) + Math.abs(fy - y) <= 3);
function afstandKaart() {
  const d = new Array<number>(COLS * ROWS).fill(Infinity);
  const q: [number, number][] = [];
  KAART.forEach((t, i) => {
    if (t === "uitgang") {
      d[i] = 0;
      q.push([i % COLS, Math.floor(i / COLS)]);
    }
  });
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (!begaanbaar(nx, ny) || KAART[k(nx, ny)] === "lift" || bijVuur(nx, ny)) continue;
      if (d[k(nx, ny)]! > d[k(x, y)]! + 1) {
        d[k(nx, ny)] = d[k(x, y)]! + 1;
        q.push([nx, ny]);
      }
    }
  }
  return d;
}
const AFSTAND = afstandKaart();

const PIJLEN: { x: number; y: number; hoek: number }[] = [];
for (let y = 0; y < ROWS; y++)
  for (let x = 0; x < COLS; x++) {
    if (KAART[k(x, y)] !== "gang" || (x + y) % 3 !== 0 || bijVuur(x, y)) continue;
    let best: [number, number] | null = null;
    let bestD = AFSTAND[k(x, y)]!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nd = AFSTAND[k(x + dx, y + dy)] ?? Infinity;
      if (nd < bestD) {
        bestD = nd;
        best = [dx, dy];
      }
    }
    if (best) PIJLEN.push({ x, y, hoek: Math.atan2(best[1], best[0]) });
  }

type Klasgenoot = { x: number; y: number; volgt: boolean; gered: boolean; naam: string };

export function Evacuatie({ onKlaar }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useToetsen();
  const [hud, setHud] = useState({
    tijd: TIJD,
    harten: 3,
    gered: 0,
    bericht: "Zoek de groene pijlen 🟩 naar de nooduitgang!",
  });

  const s = useRef({
    px: 18.5 * T,
    py: 2.5 * T,
    tijd: TIJD,
    harten: 3,
    onkwetsbaar: 0,
    vuur: new Set<number>(START_VUUR.map(([x, y]) => k(x, y))),
    vuurTimer: 0,
    klas: [
      { x: 9 * T + 12, y: 2 * T + 12, volgt: false, gered: false, naam: "Sem" },
      { x: 2 * T + 12, y: 9 * T + 12, volgt: false, gered: false, naam: "Noor" },
      { x: 17 * T + 12, y: 16 * T + 12, volgt: false, gered: false, naam: "Daan" },
    ] as Klasgenoot[],
    spoor: [] as { x: number; y: number }[],
    deeltjes: [] as Deeltje[],
    klaar: false,
    bericht: "",
    berichtTijd: 0,
    rennenGemeld: false,
    hudTimer: 0,
  });

  const kleur = useRef(themaKleuren());

  const melding = (tekst: string) => {
    s.current.bericht = tekst;
    s.current.berichtTijd = 2.5;
  };

  const eindig = (ontsnapt: boolean) => {
    const st = s.current;
    if (st.klaar) return;
    st.klaar = true;
    const gered = st.klas.filter((c) => c.volgt).length;
    st.klas.forEach((c) => {
      if (c.volgt) c.gered = true;
    });
    const punten = ontsnapt
      ? Math.round(40 + st.tijd * 1.2 + gered * 30 + st.harten * 10)
      : gered * 5;
    const score = ontsnapt ? clamp01(punten / 195) : 0.05;
    if (ontsnapt) {
      snd.juich();
      spawnDeeltjes(
        st.deeltjes,
        st.px,
        st.py,
        50,
        [kleur.current.mint, kleur.current.amber, kleur.current.brand],
        260,
      );
    } else snd.fout();
    setHud((h) => ({
      ...h,
      gered,
      bericht: ontsnapt
        ? `🎉 Veilig op de verzamelplaats${gered ? ` met ${gered} klasgeno${gered === 1 ? "ot" : "ten"}` : ""}!`
        : st.harten <= 0
          ? "😵 Je bent door de rook overmand. De brandweer haalt je naar buiten."
          : "⏰ Te laat… De brandweer moest je komen halen.",
    }));
    window.setTimeout(
      () =>
        onKlaar({
          score,
          punten,
          tekst: ontsnapt
            ? `Je was op tijd buiten met nog ${Math.ceil(st.tijd)} seconden over${gered ? ` en hielp ${gered} klasgeno${gered === 1 ? "ot" : "ten"} naar buiten` : ", maar je liet je verdwaalde klasgenoten achter"}.`
            : "Je kwam niet op tijd buiten. Onthoud: volg de groene bordjes en neem de kortste veilige route.",
        }),
      1600,
    );
  };

  useCanvasLoop(canvasRef, W, H, (ctx, dt, t) => {
    const st = s.current;
    const c = kleur.current;
    const R = 8;

    if (!st.klaar) {
      st.tijd -= dt;
      st.onkwetsbaar = Math.max(0, st.onkwetsbaar - dt);
      st.berichtTijd -= dt;
      if (st.tijd <= 0) {
        st.tijd = 0;
        eindig(false);
      }

      /* vuur verspreidt zich */
      st.vuurTimer += dt;
      if (st.vuurTimer > 1.1 && st.vuur.size < 90) {
        st.vuurTimer = 0;
        for (const i of [...st.vuur]) {
          if (Math.random() > 0.33) continue;
          const x = i % COLS;
          const y = Math.floor(i / COLS);
          const opties = (
            [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ] as const
          )
            .map(([dx, dy]) => [x + dx, y + dy] as const)
            .filter(([nx, ny]) => begaanbaar(nx, ny) && KAART[k(nx, ny)] !== "uitgang");
          const n = opties[Math.floor(Math.random() * opties.length)];
          if (n) st.vuur.add(k(n[0], n[1]));
        }
      }

      const tegelVan = (x: number, y: number) => [Math.floor(x / T), Math.floor(y / T)] as const;
      const inRook = (x: number, y: number) => {
        const [tx, ty] = tegelVan(x, y);
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++)
            if (Math.abs(dx) + Math.abs(dy) <= 2 && st.vuur.has(k(tx + dx, ty + dy))) return true;
        return false;
      };
      const kanStaan = (x: number, y: number) =>
        [
          [-R, -R],
          [R, -R],
          [-R, R],
          [R, R],
        ].every(([ox, oy]) => {
          const [tx, ty] = tegelVan(x + ox!, y + oy!);
          return begaanbaar(tx, ty);
        });

      /* bewegen */
      let dx = 0;
      let dy = 0;
      if (keys.current.has("up")) dy -= 1;
      if (keys.current.has("down")) dy += 1;
      if (keys.current.has("left")) dx -= 1;
      if (keys.current.has("right")) dx += 1;
      if (keys.current.has("run") && !st.rennenGemeld) {
        st.rennenGemeld = true;
        melding("🚶 Niet rennen bij een ontruiming — rustig doorlopen!");
      }
      const rook = inRook(st.px, st.py);
      if (dx || dy) {
        const v = 118 * (rook ? 0.5 : 1);
        const oudX = st.px;
        const oudY = st.py;
        const p = { x: st.px, y: st.py };
        beweeg(p, dx, dy, v * dt, T, kanStaan);
        st.px = p.x;
        st.py = p.y;
        if (st.px !== oudX || st.py !== oudY) {
          st.spoor.unshift({ x: st.px, y: st.py });
          if (st.spoor.length > 120) st.spoor.length = 120;
        }
      }

      const [tx, ty] = tegelVan(st.px, st.py);
      const tegel = KAART[k(tx, ty)];

      /* lift = verboden */
      if (tegel === "lift" && st.onkwetsbaar <= 0) {
        st.harten -= 1;
        st.onkwetsbaar = 1.4;
        snd.fout();
        melding("🛗 Nooit de lift bij brand! Die kan blijven steken.");
        st.px = 12.5 * T;
        st.py = 6.5 * T;
      }

      /* vuur aanraken */
      if (st.vuur.has(k(tx, ty)) && st.onkwetsbaar <= 0) {
        st.harten -= 1;
        st.onkwetsbaar = 1.4;
        snd.bots();
        melding("🔥 Au! Ga niet door het vuur — zoek een andere route.");
        const terug = st.spoor[14] ?? st.spoor.at(-1);
        if (terug) {
          st.px = terug.x;
          st.py = terug.y;
        }
      }
      if (st.harten <= 0) eindig(false);

      /* klasgenoten oppikken */
      for (const kg of st.klas) {
        if (kg.volgt) continue;
        if (Math.hypot(kg.x - st.px, kg.y - st.py) < 20) {
          kg.volgt = true;
          snd.ster();
          melding(`🤝 ${kg.naam} loopt met je mee!`);
          spawnDeeltjes(st.deeltjes, kg.x, kg.y, 14, [c.mint, c.amber], 140);
        }
      }
      let n = 0;
      for (const kg of st.klas) {
        if (!kg.volgt) continue;
        n++;
        const p = st.spoor[Math.min(st.spoor.length - 1, n * 14)];
        if (p) {
          kg.x += (p.x - kg.x) * Math.min(1, dt * 10);
          kg.y += (p.y - kg.y) * Math.min(1, dt * 10);
        }
      }

      /* uitgang bereikt */
      if (tegel === "uitgang") eindig(true);

      st.hudTimer += dt;
      if (st.hudTimer > 0.2) {
        st.hudTimer = 0;
        setHud({
          tijd: st.tijd,
          harten: st.harten,
          gered: st.klas.filter((x) => x.volgt).length,
          bericht:
            st.berichtTijd > 0
              ? st.bericht
              : rook
                ? "😷 Rook! Je loopt langzamer. Blijf laag en loop door."
                : "Volg de groene pijlen naar een nooduitgang 🚪",
        });
      }
    }

    /* ============ tekenen ============ */
    ctx.fillStyle = "#2b2f3f";
    ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const tg = KAART[k(x, y)];
        if (tg === "muur") continue;
        ctx.fillStyle =
          tg === "gang"
            ? c.paper
            : tg === "lokaal"
              ? c.secondary
              : tg === "uitgang"
                ? c.mint
                : "#9aa3b5";
        ctx.fillRect(x * T, y * T, T, T);
      }
    // vluchtroute-pijlen
    ctx.strokeStyle = c.mint;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.75;
    for (const p of PIJLEN) {
      const cx = (p.x + 0.5) * T;
      const cy = (p.y + 0.5) * T;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(p.hoek);
      ctx.beginPath();
      ctx.moveTo(-5, -5);
      ctx.lineTo(2, 0);
      ctx.lineTo(-5, 5);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    // uitgangen en lift
    KAART.forEach((tg, i) => {
      const x = (i % COLS) * T + T / 2;
      const y = Math.floor(i / COLS) * T + T / 2;
      if (tg === "uitgang") emoji(ctx, "🚪", x, y, 17);
      if (tg === "lift") emoji(ctx, "🛗", x, y, 17);
    });
    // labels
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    ctx.fillText("NOODUITGANG", 1.6 * T, 4.4 * T);
    ctx.fillText("NOODUITGANG", 9.5 * T, 18.6 * T);
    ctx.save();
    ctx.translate(26.6 * T, 9 * T);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("NOODUITGANG", 0, 0);
    ctx.restore();

    // rook
    for (const i of st.vuur) {
      const x = (i % COLS) * T + T / 2;
      const y = Math.floor(i / COLS) * T + T / 2;
      const grad = ctx.createRadialGradient(x, y, 4, x, y, T * 2.4);
      grad.addColorStop(0, "rgba(60,60,70,0.35)");
      grad.addColorStop(1, "rgba(60,60,70,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(x - T * 2.5, y - T * 2.5, T * 5, T * 5);
    }
    // vuur
    for (const i of st.vuur) {
      const x = (i % COLS) * T + T / 2;
      const y = Math.floor(i / COLS) * T + T / 2;
      ctx.fillStyle = `rgba(255,${90 + Math.floor(60 * Math.sin(t * 9 + i))},40,0.55)`;
      ctx.fillRect(x - T / 2, y - T / 2, T, T);
      emoji(ctx, "🔥", x, y - 1 + Math.sin(t * 10 + i) * 1.5, 17 + Math.sin(t * 7 + i) * 2);
    }

    // klasgenoten
    for (const kg of st.klas) {
      if (!kg.volgt) {
        ctx.fillStyle = c.amber;
        ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 5);
        ctx.beginPath();
        ctx.arc(kg.x, kg.y, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        emoji(ctx, "🙋", kg.x, kg.y - 18 - Math.abs(Math.sin(t * 4)) * 3, 12);
      }
      emoji(ctx, "🧒", kg.x, kg.y, 18);
    }

    // speler
    const knip = st.onkwetsbaar > 0 && Math.floor(t * 12) % 2 === 0;
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(st.px, st.py + 8, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!knip) emoji(ctx, "🧑‍🎓", st.px, st.py, 21);

    updateDeeltjes(ctx, st.deeltjes, dt);

    // rode alarm-gloed
    if (!st.klaar) {
      ctx.fillStyle = `rgba(220,40,60,${0.06 + 0.06 * Math.sin(t * 6)})`;
      ctx.fillRect(0, 0, W, H);
    }
  });

  return (
    <div>
      <Hud>
        <HudPill tone={hud.tijd < 12 ? "bad" : "warn"}>⏱ {Math.ceil(hud.tijd)}s</HudPill>
        <HudPill tone="bad">
          {"❤️".repeat(Math.max(0, hud.harten))}
          {"🖤".repeat(Math.max(0, 3 - hud.harten))}
        </HudPill>
        <HudPill tone="good">🤝 {hud.gered}/3 klasgenoten</HudPill>
      </Hud>
      <TijdBalk fractie={hud.tijd / TIJD} />
      <SpelCanvas canvasRef={canvasRef} W={W} H={H} />
      <p className="mt-2 min-h-[1.5rem] text-sm font-semibold">{hud.bericht}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">⌨️ WASD of pijltjes om te lopen</p>
        <PadKnoppen keys={keys} className="sm:hidden" />
      </div>
    </div>
  );
}
