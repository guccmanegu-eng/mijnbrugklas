import { useEffect, useRef, useState } from "react";
import { snd } from "@/lib/game/sound";
import { cn } from "@/lib/utils";
import { PadKnoppen, beweeg, useToetsen } from "./minigames/kit";
import {
  COLS,
  ROOMS,
  ROWS,
  STAR_TILES,
  TILE,
  WALKABLE,
  key,
  maakNpcs,
  npcPos,
  updateNpc,
  type Aankomst,
  type RoomDef,
} from "./SchoolMap";

/* ========================================================================
 * Lokaalzoeker 3D — loop in first-person door de gangen van het
 * Martinuscollege. Raycasting op een gewone 2D-canvas: geen extra
 * libraries nodig, werkt op elke laptop en Chromebook.
 *
 * - Elke vleugel heeft eigen kluisjeskleur (A blauw, B roze, C groen).
 * - Op elke deur staat het lokaalnummer.
 * - Roosterpalen 🪧 in de gangen tonen roosterwijzigingen.
 * - Kompas + minikaart helpen je de weg te vinden.
 * ===================================================================== */

const W = 640;
const H = 360;
const FOV = 0.68;
const SEC_PER_MIN = 4;
const STRAF_MIN = 3;
const R = 0.22; // spelerstraal in tegels

const DEUR_VAN = new Map<string, RoomDef>();
for (const r of ROOMS) DEUR_VAN.set(key(r.doorX, r.doorY), r);

const loopbaar = (x: number, y: number) => WALKABLE.has(key(x, y));
const isDeur = (x: number, y: number) => DEUR_VAN.has(key(x, y));
const kamerOp = (x: number, y: number) =>
  ROOMS.find((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) ?? null;
const vleugelVan = (y: number) => (y < 8.5 ? 0 : y < 16.5 ? 1 : 2);
const VLEUGELS = [
  { letter: "A", kleur: "#4f6fd0", donker: "#34509f" },
  { letter: "B", kleur: "#d0587a", donker: "#a33c5b" },
  { letter: "C", kleur: "#3fa36a", donker: "#2b7a4d" },
];
/** Bordjes aan het eind van elke gang */
const BORD_MUREN = new Map<string, number>();
[4, 12, 20].forEach((y, i) => {
  BORD_MUREN.set(key(0, y), i);
  BORD_MUREN.set(key(26, y), i);
});
const ROOSTERPALEN: [number, number][] = [
  [13, 12],
  [1, 8],
  [25, 16],
  [6, 20],
];

/* ---------- procedurele texturen ---------- */

type Texturen = {
  gang: HTMLCanvasElement[];
  klas: HTMLCanvasElement;
  bord: HTMLCanvasElement[];
  deur: Map<string, HTMLCanvasElement>;
};

function maakCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function maakTexturen(): Texturen {
  const gang = VLEUGELS.map((v) => {
    const [c, g] = maakCanvas(64, 64);
    g.fillStyle = "#ece8df";
    g.fillRect(0, 0, 64, 64);
    // kluisjes
    g.fillStyle = v.kleur;
    g.fillRect(0, 22, 64, 36);
    g.fillStyle = "rgba(0,0,0,0.25)";
    for (let x = 0; x < 64; x += 16) g.fillRect(x, 22, 1, 36);
    g.fillRect(0, 39, 64, 1);
    g.fillStyle = "rgba(255,255,255,0.35)";
    for (let x = 0; x < 64; x += 16) {
      g.fillRect(x + 4, 25, 8, 1);
      g.fillRect(x + 4, 27, 8, 1);
      g.fillRect(x + 4, 42, 8, 1);
      g.fillRect(x + 4, 44, 8, 1);
      g.fillStyle = "#e9e9ee";
      g.fillRect(x + 12, 31, 2, 4);
      g.fillRect(x + 12, 48, 2, 4);
      g.fillStyle = "rgba(255,255,255,0.35)";
    }
    // plint + bovenrand
    g.fillStyle = "#4a4652";
    g.fillRect(0, 58, 64, 6);
    g.fillStyle = v.donker;
    g.fillRect(0, 19, 64, 3);
    // tl-licht weerkaatsing bovenaan
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.fillRect(0, 4, 64, 2);
    return c;
  });

  const [klas, k] = maakCanvas(64, 64);
  k.fillStyle = "#f4f1e6";
  k.fillRect(0, 0, 64, 64);
  k.fillStyle = "#ffffff";
  k.fillRect(6, 14, 52, 24);
  k.strokeStyle = "#9aa0ad";
  k.lineWidth = 2;
  k.strokeRect(6, 14, 52, 24);
  k.fillStyle = "#3a6ad8";
  k.fillRect(10, 19, 22, 2);
  k.fillRect(10, 24, 30, 2);
  k.fillStyle = "#d8483a";
  k.fillRect(10, 29, 16, 2);
  k.fillStyle = "#c9a26b";
  k.fillRect(0, 54, 64, 10);
  k.fillStyle = "#6b5a46";
  k.fillRect(0, 58, 64, 6);

  const bord = VLEUGELS.map((v) => {
    const [c, g] = maakCanvas(96, 96);
    g.fillStyle = "#ece8df";
    g.fillRect(0, 0, 96, 96);
    g.fillStyle = v.kleur;
    g.fillRect(10, 18, 76, 52);
    g.fillStyle = "#fff";
    g.textAlign = "center";
    g.font = "bold 12px sans-serif";
    g.fillText("VLEUGEL", 48, 34);
    g.font = "bold 34px sans-serif";
    g.fillText(v.letter, 48, 64);
    g.fillStyle = "#4a4652";
    g.fillRect(0, 88, 96, 8);
    return c;
  });

  const deur = new Map<string, HTMLCanvasElement>();
  for (const r of ROOMS) {
    const v = VLEUGELS[vleugelVan(r.y)]!;
    const [c, g] = maakCanvas(96, 96);
    g.fillStyle = "#ece8df";
    g.fillRect(0, 0, 96, 96);
    // kozijn + deur
    g.fillStyle = v.donker;
    g.fillRect(18, 8, 60, 88);
    g.fillStyle = "#b9834f";
    g.fillRect(23, 12, 50, 84);
    g.fillStyle = "rgba(0,0,0,0.12)";
    for (let y = 16; y < 96; y += 7) g.fillRect(23, y, 50, 1);
    // raampje
    g.fillStyle = "#bfe0ff";
    g.fillRect(40, 20, 16, 22);
    g.fillStyle = "rgba(255,255,255,0.6)";
    g.fillRect(42, 22, 4, 18);
    // naambordje
    g.fillStyle = "#ffffff";
    g.fillRect(26, 48, 44, 18);
    g.strokeStyle = v.donker;
    g.lineWidth = 2;
    g.strokeRect(26, 48, 44, 18);
    g.fillStyle = "#1f2440";
    g.font = "bold 13px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(r.code, 48, 58);
    // klink
    g.fillStyle = "#e6e6ea";
    g.fillRect(64, 72, 6, 3);
    deur.set(r.code, c);
  }
  return { gang, klas, bord, deur };
}

/* ---------- component ---------- */

type Props = {
  target: string;
  echtLokaal?: string;
  vakNaam: string;
  vakIcon: string;
  minutenOver: number;
  startLokaal: string;
  onArrive: (lokaal: string, info: Aankomst) => void;
  onStar: () => void;
  onRoosterpaal?: () => void;
};

type Sprite = { x: number; y: number; e: string; schaal: number; hoog?: number; npc?: boolean };

export function SchoolMap3D(props: Props) {
  const { target: startTarget, echtLokaal, vakNaam, vakIcon, minutenOver, startLokaal } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useToetsen();
  const [target, setTarget] = useState(startTarget);
  const [klok, setKlok] = useState({ min: 1, fouten: 0, sterren: 0 });
  const [bericht, setBericht] = useState<{ tekst: string; tone: "bad" | "warn" | "good" } | null>(
    null,
  );
  const [aangekomen, setAangekomen] = useState(false);
  const [kaartAan, setKaartAan] = useState(true);
  const kaartRef = useRef(true);
  kaartRef.current = kaartAan;
  const cbs = useRef(props);
  cbs.current = props;
  const echt = echtLokaal ?? startTarget;

  const meld = (tekst: string, tone: "bad" | "warn" | "good", duur = 2.8) => {
    setBericht({ tekst, tone });
    st.current.berichtTijd = duur;
  };

  const st = useRef(
    (() => {
      const start = ROOMS.find((r) => r.code === startLokaal);
      const doel = ROOMS.find((r) => r.code === startTarget) ?? ROOMS[0]!;
      const px = start ? start.doorX + 0.5 : 13.5;
      const py = start ? start.corridorY + 0.5 : 20.5;
      return {
        px,
        py,
        hoek: doel.doorX + 0.5 >= px ? 0 : Math.PI,
        sec: 0,
        fouten: 0,
        stun: 0,
        laatsteKamer: "",
        rennenStraf: 0,
        target: startTarget,
        berichtTijd: 0,
        sterren: new Set<string>(),
        palen: new Set<string>(),
        npcs: maakNpcs().map((n) => ({
          ...n,
          x: n.x / TILE,
          y: n.y / TILE,
          vx: n.vx / TILE,
          vy: n.vy / TILE,
          min: n.min / TILE,
          max: n.max / TILE,
        })),
        klaar: false,
        stapT: 0,
        loopT: 0,
        fade: 0,
        belGegaan: false,
        slepen: null as number | null,
        confetti: [] as { x: number; y: number; vx: number; vy: number; k: string; life: number }[],
        laatsteMin: -1,
      };
    })(),
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;
    const tex = maakTexturen();
    const zbuf = new Float32Array(W);
    let raf = 0;
    let last = performance.now();

    const kanStaan = (x: number, y: number) =>
      loopbaar(Math.floor(x - R), Math.floor(y - R)) &&
      loopbaar(Math.floor(x + R), Math.floor(y - R)) &&
      loopbaar(Math.floor(x - R), Math.floor(y + R)) &&
      loopbaar(Math.floor(x + R), Math.floor(y + R));

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const s = st.current;
      const doelKamer = ROOMS.find((r) => r.code === s.target) ?? ROOMS[0]!;

      /* ================= logica ================= */
      let beweegt = false;
      if (!s.klaar) {
        s.sec += dt;
        s.stun = Math.max(0, s.stun - dt);
        s.rennenStraf = Math.max(0, s.rennenStraf - dt);
        s.fade = Math.max(0, s.fade - dt * 2);
        if (s.berichtTijd > 0) {
          s.berichtTijd -= dt;
          if (s.berichtTijd <= 0) setBericht(null);
        }
        const min = 1 + Math.floor(s.sec / SEC_PER_MIN) + s.fouten * STRAF_MIN;
        if (min !== s.laatsteMin) {
          s.laatsteMin = min;
          setKlok({ min, fouten: s.fouten, sterren: s.sterren.size });
          if (!s.belGegaan && min > cbs.current.minutenOver) {
            s.belGegaan = true;
            snd.bel();
            meld("🔔 De bel gaat! Je les is begonnen — schiet op!", "bad");
          }
        }

        /* draaien + lopen */
        const k = keys.current;
        const draai = (k.has("right") ? 1 : 0) - (k.has("left") ? 1 : 0);
        s.hoek += draai * 2.6 * dt;
        const vooruit = (k.has("up") ? 1 : 0) - (k.has("down") ? 1 : 0);
        if (vooruit && s.stun <= 0) {
          const v = (k.has("run") ? 5.4 : 3.5) * (vooruit < 0 ? 0.6 : 1);
          const p = { x: s.px, y: s.py };
          const mx = Math.cos(s.hoek) * vooruit;
          const my = Math.sin(s.hoek) * vooruit;
          beweeg(p, mx, my, v * dt, 1, kanStaan);
          if (Math.hypot(p.x - s.px, p.y - s.py) < v * dt * 0.5) {
            // deur-hulp: loop je (bijna) recht op een opening af, schuif er dan in
            p.x = s.px;
            p.y = s.py;
            if (Math.abs(mx) > Math.abs(my)) beweeg(p, Math.sign(mx), 0, v * dt, 1, kanStaan);
            else beweeg(p, 0, Math.sign(my), v * dt, 1, kanStaan);
          }
          beweegt = p.x !== s.px || p.y !== s.py;
          s.px = p.x;
          s.py = p.y;
          if (beweegt) {
            s.loopT += dt * (k.has("run") ? 1.5 : 1);
            s.stapT -= dt;
            if (s.stapT <= 0) {
              s.stapT = k.has("run") ? 0.26 : 0.38;
              snd.stap();
            }
          }
        }

        /* NPC's */
        for (const n of s.npcs) {
          const d = updateNpc(n, dt, s.px, s.py, 1.6, 0.3);
          if (n.conc && d < 2.3 && k.has("run") && s.rennenStraf <= 0) {
            s.rennenStraf = 5;
            s.sec += SEC_PER_MIN;
            snd.bots();
            meld("🧑‍🔧 Conciërge: 'Niet rennen in de gang!' (+1 min)", "warn");
          }
        }

        /* sterren */
        for (const [sx, sy] of STAR_TILES) {
          const sk = key(sx, sy);
          if (s.sterren.has(sk)) continue;
          if (Math.hypot(sx + 0.5 - s.px, sy + 0.5 - s.py) < 0.55) {
            s.sterren.add(sk);
            snd.ster();
            cbs.current.onStar();
            setKlok((x) => ({ ...x, sterren: s.sterren.size }));
          }
        }

        /* roosterpalen */
        for (const [rx, ry] of ROOSTERPALEN) {
          const rk = key(rx, ry);
          if (s.palen.has(rk)) continue;
          if (Math.hypot(rx + 0.5 - s.px, ry + 0.5 - s.py) < 0.8) {
            s.palen.add(rk);
            snd.klik();
            if (s.target !== echt) {
              s.target = echt;
              setTarget(echt);
              cbs.current.onRoosterpaal?.();
              meld(`🪧 Roosterwijziging! ${cbs.current.vakNaam} is nu in ${echt}.`, "good", 4);
            } else {
              cbs.current.onRoosterpaal?.();
              meld(`🪧 Roosterpaal: ${cbs.current.vakNaam} gewoon in ${echt}.`, "good");
            }
          }
        }

        /* lokalen binnenlopen */
        const kamer = ROOMS.find(
          (r) =>
            s.px > r.x + 0.15 &&
            s.px < r.x + r.w - 0.15 &&
            s.py > r.y + 0.15 &&
            s.py < r.y + r.h - 0.15,
        );
        if (!kamer) s.laatsteKamer = "";
        else if (kamer.code !== s.laatsteKamer) {
          s.laatsteKamer = kamer.code;
          snd.deur();
          const terug = () => {
            s.px = kamer.doorX + 0.5;
            s.py = kamer.corridorY + 0.5;
            const doel = ROOMS.find((r) => r.code === s.target) ?? kamer;
            s.hoek = doel.doorX >= kamer.doorX ? 0 : Math.PI;
            s.laatsteKamer = "";
            s.fade = 1;
          };
          if (kamer.code === echt) {
            s.klaar = true;
            setAangekomen(true);
            snd.goed();
            const kl = ["#3540b0", "#3fae6a", "#e0a32e", "#d33363"];
            for (let i = 0; i < 90; i++)
              s.confetti.push({
                x: W / 2,
                y: H / 2,
                vx: (Math.random() - 0.5) * 600,
                vy: (Math.random() - 0.9) * 420,
                k: kl[i % 4]!,
                life: 1.4,
              });
            const info: Aankomst = {
              minutenOnderweg: 1 + Math.floor(s.sec / SEC_PER_MIN) + s.fouten * STRAF_MIN,
              fouten: s.fouten,
              seconden: Math.round(s.sec),
            };
            meld(`🎉 Gevonden! Welkom in ${kamer.code}.`, "good", 5);
            window.setTimeout(() => cbs.current.onArrive(kamer.code, info), 1100);
          } else if (kamer.code === s.target) {
            s.fouten++;
            s.target = echt;
            setTarget(echt);
            snd.fout();
            meld(
              `📝 Leeg lokaal! Briefje op het bord: "Les verplaatst naar ${echt}". (+${STRAF_MIN} min)`,
              "bad",
              4,
            );
            terug();
          } else {
            s.fouten++;
            snd.fout();
            meld(
              `😅 Oeps, dit is ${kamer.code} — hier zit een andere klas! (+${STRAF_MIN} min)`,
              "bad",
            );
            terug();
          }
          setKlok((x) => ({ ...x, fouten: s.fouten }));
        }
      }

      /* ================= tekenen ================= */
      const dirX = Math.cos(s.hoek);
      const dirY = Math.sin(s.hoek);
      const planeX = -dirY * FOV;
      const planeY = dirX * FOV;
      const bob = beweegt ? Math.sin(s.loopT * 11) * 4 : 0;
      const horizon = H / 2 + bob;

      // plafond met tl-balken
      const pg = ctx.createLinearGradient(0, 0, 0, horizon);
      pg.addColorStop(0, "#d9dce6");
      pg.addColorStop(1, "#8f94a6");
      ctx.fillStyle = pg;
      ctx.fillRect(0, 0, W, horizon);
      // vloer (linoleum)
      const vg = ctx.createLinearGradient(0, horizon, 0, H);
      vg.addColorStop(0, "#6f6a62");
      vg.addColorStop(1, "#b9b0a2");
      ctx.fillStyle = vg;
      ctx.fillRect(0, horizon, W, H - horizon);

      // muren (DDA raycasting)
      const mapX0 = Math.floor(s.px);
      const mapY0 = Math.floor(s.py);
      for (let x = 0; x < W; x++) {
        const camX = (2 * x) / W - 1;
        const rdx = dirX + planeX * camX;
        const rdy = dirY + planeY * camX;
        let mapX = mapX0;
        let mapY = mapY0;
        const deltaX = rdx === 0 ? 1e30 : Math.abs(1 / rdx);
        const deltaY = rdy === 0 ? 1e30 : Math.abs(1 / rdy);
        const stepX = rdx < 0 ? -1 : 1;
        const stepY = rdy < 0 ? -1 : 1;
        let sideX = rdx < 0 ? (s.px - mapX) * deltaX : (mapX + 1 - s.px) * deltaX;
        let sideY = rdy < 0 ? (s.py - mapY) * deltaY : (mapY + 1 - s.py) * deltaY;
        let side = 0;
        let hit = false;
        for (let i = 0; i < 80; i++) {
          if (sideX < sideY) {
            sideX += deltaX;
            mapX += stepX;
            side = 0;
          } else {
            sideY += deltaY;
            mapY += stepY;
            side = 1;
          }
          if (
            mapX < 0 ||
            mapY < 0 ||
            mapX >= COLS ||
            mapY >= ROWS ||
            !loopbaar(mapX, mapY) ||
            isDeur(mapX, mapY)
          ) {
            hit = true;
            break;
          }
        }
        if (!hit) {
          zbuf[x] = 1e9;
          continue;
        }
        const perp = Math.max(0.05, side === 0 ? sideX - deltaX : sideY - deltaY);
        zbuf[x] = perp;
        const lineH = H / perp;
        const top = horizon - lineH / 2;
        let wallX = side === 0 ? s.py + perp * rdy : s.px + perp * rdx;
        wallX -= Math.floor(wallX);

        let t2: HTMLCanvasElement;
        const deur = DEUR_VAN.get(key(mapX, mapY));
        const bord = BORD_MUREN.get(key(mapX, mapY));
        if (deur) t2 = tex.deur.get(deur.code)!;
        else if (bord !== undefined) t2 = tex.bord[bord]!;
        else {
          const fx = side === 0 ? mapX - stepX : mapX;
          const fy = side === 1 ? mapY - stepY : mapY;
          t2 = kamerOp(fx, fy) ? tex.klas : tex.gang[vleugelVan(fy)]!;
        }
        let texX = Math.floor(wallX * t2.width);
        // y-as wijst naar beneden: spiegel zodat tekst leesbaar is
        if ((side === 0 && rdx < 0) || (side === 1 && rdy > 0)) texX = t2.width - texX - 1;
        ctx.drawImage(t2, texX, 0, 1, t2.height, x, top, 1, lineH);

        // doeldeur laten oplichten
        if (deur && deur.code === s.target) {
          ctx.fillStyle = `rgba(80,220,140,${0.18 + 0.12 * Math.sin(t * 5)})`;
          ctx.fillRect(x, top, 1, lineH);
        }
        const schaduw = Math.min(0.78, perp / 13) + (side ? 0.12 : 0);
        ctx.fillStyle = `rgba(14,16,30,${schaduw})`;
        ctx.fillRect(x, top, 1, lineH);
      }

      /* sprites */
      const sprites: Sprite[] = [];
      for (const [sx, sy] of STAR_TILES)
        if (!s.sterren.has(key(sx, sy)))
          sprites.push({
            x: sx + 0.5,
            y: sy + 0.5,
            e: "⭐",
            schaal: 0.35,
            hoog: 0.08 + Math.sin(t * 3 + sx) * 0.05,
          });
      for (const [rx, ry] of ROOSTERPALEN)
        sprites.push({
          x: rx + 0.5,
          y: ry + 0.5,
          e: s.palen.has(key(rx, ry)) ? "📋" : "🪧",
          schaal: 0.6,
        });
      for (const n of s.npcs) sprites.push({ ...npcPos(n), e: n.e, schaal: 0.62, npc: true });
      sprites.push({
        x: doelKamer.doorX + 0.5,
        y: doelKamer.corridorY + 0.5,
        e: "🎯",
        schaal: 0.3,
        hoog: -0.33 + Math.sin(t * 3) * 0.04,
      });

      const invDet = 1 / (planeX * dirY - dirX * planeY);
      const geprojecteerd = sprites
        .map((sp) => {
          const rx = sp.x - s.px;
          const ry = sp.y - s.py;
          const tx = invDet * (dirY * rx - dirX * ry);
          const ty = invDet * (-planeY * rx + planeX * ry);
          return { sp, tx, ty };
        })
        .filter((p) => p.ty > (p.sp.npc ? 0.45 : 0.2))
        .sort((a, b) => b.ty - a.ty);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const { sp, tx, ty } of geprojecteerd) {
        const sx = (W / 2) * (1 + tx / ty);
        const eenheid = H / ty;
        const grootte = eenheid * sp.schaal;
        // staat op de vloer, tenzij 'hoog' gezet is
        // hoogte t.o.v. ooghoogte: 0 = ooghoogte, +0.5 = vloer, −0.5 = plafond
        const zc = sp.hoog ?? 0.5 - sp.schaal / 2;
        const cy = horizon + eenheid * zc;
        const x0 = Math.max(0, Math.floor(sx - grootte / 2));
        const x1 = Math.min(W - 1, Math.ceil(sx + grootte / 2));
        let eerste = -1;
        let laatste = -1;
        for (let x = x0; x <= x1; x++)
          if (zbuf[x]! > ty) {
            if (eerste < 0) eerste = x;
            laatste = x;
          }
        if (eerste < 0) continue;
        ctx.save();
        ctx.beginPath();
        ctx.rect(eerste, 0, laatste - eerste + 1, H);
        ctx.clip();
        if (sp.npc) {
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.beginPath();
          ctx.ellipse(
            sx,
            horizon + eenheid * 0.5,
            grootte * 0.3,
            grootte * 0.07,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.globalAlpha = Math.max(0.25, 1 - ty / 16);
        ctx.font = `${Math.max(4, grootte)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif`;
        ctx.fillText(sp.e, sx, cy);
        ctx.restore();
      }

      /* kompas */
      const tdx = doelKamer.doorX + 0.5 - s.px;
      const tdy = doelKamer.corridorY + 0.5 - s.py;
      let rel = Math.atan2(tdy, tdx) - s.hoek;
      rel = Math.atan2(Math.sin(rel), Math.cos(rel));
      ctx.save();
      ctx.translate(W / 2, 30);
      ctx.fillStyle = "rgba(20,22,40,0.65)";
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(rel);
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(9, 8);
      ctx.lineTo(0, 3);
      ctx.lineTo(-9, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px ui-sans-serif, system-ui";
      ctx.fillText(`${s.target} · ${Math.round(Math.hypot(tdx, tdy) * 3)} m`, W / 2, 62);

      /* minikaart */
      if (kaartRef.current) {
        const sch = 4;
        const mx = W - COLS * sch - 8;
        const my = 8;
        ctx.fillStyle = "rgba(20,22,40,0.7)";
        ctx.fillRect(mx - 4, my - 4, COLS * sch + 8, ROWS * sch + 8);
        for (const kk of WALKABLE) {
          const [cx, cy2] = kk.split(",").map(Number) as [number, number];
          const kmr = kamerOp(cx, cy2);
          ctx.fillStyle = kmr
            ? kmr.code === s.target
              ? `rgba(74,222,128,${0.6 + 0.4 * Math.sin(t * 6)})`
              : "rgba(255,255,255,0.28)"
            : "rgba(255,255,255,0.75)";
          ctx.fillRect(mx + cx * sch, my + cy2 * sch, sch, sch);
        }
        for (const n of s.npcs) {
          ctx.fillStyle = n.conc ? "#f59e0b" : "#94a3b8";
          ctx.fillRect(mx + n.x * sch - 1.5, my + n.y * sch - 1.5, 3, 3);
        }
        for (const [rx, ry] of ROOSTERPALEN) {
          ctx.fillStyle = "#60a5fa";
          ctx.fillRect(mx + (rx + 0.5) * sch - 1.5, my + (ry + 0.5) * sch - 1.5, 3, 3);
        }
        ctx.fillStyle = "#f43f5e";
        ctx.beginPath();
        ctx.arc(mx + s.px * sch, my + s.py * sch, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mx + s.px * sch, my + s.py * sch);
        ctx.lineTo(mx + (s.px + dirX * 2) * sch, my + (s.py + dirY * 2) * sch);
        ctx.stroke();
      }

      /* botsing-wiebel, fade, confetti */
      if (s.stun > 0) {
        ctx.fillStyle = `rgba(255,200,60,${s.stun * 0.35})`;
        ctx.fillRect(0, 0, W, H);
        ctx.font = "26px serif";
        ctx.fillText("💫", W / 2 + Math.sin(t * 20) * 20, H / 2 - 40);
      }
      if (s.fade > 0) {
        ctx.fillStyle = `rgba(0,0,0,${Math.min(1, s.fade)})`;
        ctx.fillRect(0, 0, W, H);
      }
      for (let i = s.confetti.length - 1; i >= 0; i--) {
        const c = s.confetti[i]!;
        c.life -= dt;
        if (c.life <= 0) {
          s.confetti.splice(i, 1);
          continue;
        }
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.vy += 500 * dt;
        ctx.fillStyle = c.k;
        ctx.globalAlpha = Math.min(1, c.life);
        ctx.fillRect(c.x - 3, c.y - 3, 6, 6);
      }
      ctx.globalAlpha = 1;
      // vizier
      if (!s.klaar) {
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillRect(W / 2 - 1, H / 2 - 6 + bob, 2, 12);
        ctx.fillRect(W / 2 - 6, H / 2 - 1 + bob, 12, 2);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* rondkijken door te slepen (muis of vinger) */
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    st.current.slepen = e.clientX;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = st.current;
    if (s.slepen === null) return;
    const breedte = e.currentTarget.getBoundingClientRect().width || W;
    s.hoek += ((e.clientX - s.slepen) / breedte) * 3.2;
    s.slepen = e.clientX;
  };
  const onUp = () => {
    st.current.slepen = null;
  };

  const over = minutenOver - klok.min;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-bold">
        <span className="rounded-full bg-mint/15 px-3 py-1 text-mint">
          🎯 {target} · {vakIcon} {vakNaam}
        </span>
        <span
          className={cn(
            "rounded-full px-3 py-1 tabular-nums",
            over < 0
              ? "bg-rose/15 text-rose"
              : over <= 1
                ? "bg-amber/20 text-amber"
                : "bg-secondary",
          )}
        >
          {over >= 0 ? `⏱ nog ${over} min` : `⏰ ${-over} min te laat!`}
        </span>
        <span className="rounded-full bg-amber/20 px-3 py-1 text-amber">
          ⭐ {klok.sterren}/{STAR_TILES.length}
        </span>
        {klok.fouten ? (
          <span className="rounded-full bg-rose/15 px-3 py-1 text-rose">
            ❌ {klok.fouten}× fout
          </span>
        ) : null}
        {aangekomen ? (
          <span className="rounded-full bg-mint/15 px-3 py-1 text-mint">🎉 Gevonden!</span>
        ) : null}
      </div>
      <p
        className={cn(
          "mb-2 min-h-[1.25rem] text-sm font-semibold",
          bericht?.tone === "bad"
            ? "text-rose"
            : bericht?.tone === "warn"
              ? "text-amber"
              : bericht
                ? "text-mint"
                : "text-muted-foreground",
        )}
      >
        {bericht?.tekst ??
          "Lees de bordjes op de deuren. Kluisjes: A = blauw, B = roze, C = groen. Een 🪧 roosterpaal laat wijzigingen zien."}
      </p>

      <div className="relative overflow-hidden rounded-2xl border-2 border-border bg-ink">
        <canvas
          ref={canvasRef}
          className="block h-auto w-full cursor-grab touch-none select-none active:cursor-grabbing"
          style={{ aspectRatio: `${W} / ${H}`, imageRendering: "pixelated" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          <p>⌨️ ↑ / W = lopen · ← → / A D = draaien · Shift = rennen</p>
          <p>🖱️ Sleep over het beeld om rond te kijken</p>
          <button
            type="button"
            onClick={() => setKaartAan((x) => !x)}
            className="mt-1 font-semibold text-brand hover:underline"
          >
            🗺️ Minikaart {kaartAan ? "verbergen (moeilijker!)" : "tonen"}
          </button>
        </div>
        <PadKnoppen keys={keys} className="sm:hidden" />
      </div>
    </div>
  );
}
