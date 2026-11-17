# 🎒 Mijn Brugklas — oefen je eerste week op het Martinuscollege

Een browsergame voor leerlingen uit groep 8 die naar het **Martinuscollege in Grootebroek** gaan.
Je speelt een hele schoolweek: je pakt je rugzak, zoekt je lokalen (A0.02, B1.12, C2.06…),
komt wel of niet op tijd, plant je huiswerk, maakt opdrachten en sluit de week af met een toets
en een rapport. Geen echte cijfers, wel echte keuzes en gevolgen.

## Wat zit erin

| Onderdeel | Wat je doet |
|---|---|
| 🎒 Rugzak | 's Ochtends (of de avond ervoor) de juiste boeken inpakken. Tijdens de schooldag zit je rugzak dicht. |
| 🗺️ Lokaal zoeken | Zelf door de gangen lopen in 3D (of op de plattegrond). De klok loopt echt door. |
| 🪧 Roosterwijzigingen | Check de roosterpaal, anders sta je voor een leeg lokaal. |
| 📚 Huiswerk | Vijf opdrachten (Nederlands, wiskunde, Engels, geschiedenis, biologie), elk met een bonus-minigame. |
| 📅 Planning | Kies zelf wanneer je wat maakt; op tijd plannen levert punten op. |
| 📢 Live events | Brandalarm, stroomstoring, wesp in de klas, kantine-rush… elk met een eigen minigame. |
| 🕹️ Speelhal | Alle 11 minigames vrij spelen en op records jagen. |
| 📝 Toets & rapport | 12 vragen over de hele week, daarna een rapport met je sterke punten en tips. |

De voortgang wordt alleen in de browser bewaard (`localStorage`). Er gaat niets naar een server
en er wordt alleen een voornaam gevraagd.

## Zelf draaien

Nodig: [Node.js](https://nodejs.org) 20+ en npm, of [Bun](https://bun.sh).

```sh
git clone https://github.com/guccmanegu-eng/mijnbrugklas.git
cd mijnbrugklas
npm install        # of: bun install
npm run dev        # de terminal toont het adres om te openen
```

| Script | Wat het doet |
|---|---|
| `npm run dev` | Ontwikkelserver met hot reload |
| `npm run build` | Productiebuild |
| `npm run preview` | Productiebuild lokaal bekijken |
| `npm test` | Alle tests (Vitest) |
| `npm run typecheck` | TypeScript-controle |
| `npm run lint` | ESLint + Prettier-controle |
| `npm run format` | Alles netjes formatteren met Prettier |

## Hoe de code in elkaar zit

```
src/
  lib/game/
    data.ts      vakken, rooster, lokalen, huiswerk, vragen, situaties, badges
    state.tsx    de complete spelregels (reducer), opslaan/laden, afgeleide waarden
    events.ts    live events, weekplanning van events, levels, speelhal-lijst
    antwoord.ts  nakijken van open vragen (hoofdletters, komma/punt, slimme quotes…)
    random.ts    eerlijk schudden
    sound.ts     geluidjes via WebAudio (geen bestanden)
  components/game/
    AppShell.tsx         navigatie, level-balk, XP-meldingen
    SchoolMap3D.tsx      first-person gangen (raycasting op canvas)
    SchoolMap.tsx        plattegrond-versie
    Quiz.tsx, MiniGame.tsx, LiveEventDialog.tsx, minigames/*
  routes/        één bestand per pagina (TanStack Router, file-based)
  test/          Vitest-tests voor spelregels, events en routing
```

Alle spelregels zitten in één pure functie: `reducer` in `src/lib/game/state.tsx`. Daardoor zijn ze
makkelijk te testen zonder browser. Een opgeslagen spel gaat altijd eerst door `laadSave`, die
oude of beschadigde saves repareert in plaats van de app te laten crashen.

**Inhoud aanpassen** (vragen, lokalen, rooster, situaties) doe je in `src/lib/game/data.ts`.
Draai daarna `npm test`: de tests controleren onder meer dat elke meerkeuzevraag een geldig
antwoord heeft en dat de events over de week passen.

## Gebouwd met

TanStack Start · React 19 · TypeScript · Tailwind CSS 4 · Vitest

Dit project is gekoppeld aan [Lovable](https://lovable.dev): commits op `main` verschijnen ook in
de Lovable-editor. Herschrijf daarom geen gepubliceerde git-geschiedenis (geen force-push).
