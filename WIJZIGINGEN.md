# Wat is er nieuw in de Brugklas-game

## 🛠️ Onderhoudsronde (november 2026): bugs, valsspeel-lekken en inhoud

### Bugs opgelost
- **Geen "Maak eerst je profiel"-flits meer** bij het herladen: de app wacht tot je opgeslagen week is ingeladen.
- **Je week wordt niet meer per ongeluk gewist.** Wie al een week bezig is en via de startpagina op
  "Start de week" klikt, krijgt nu de keuze *verder spelen* of *opnieuw beginnen*.
- **Dashboard toont het juiste lokaal** na een roosterwijziging die je op de roosterpaal hebt gezien.
- **Favicon werkte niet** (verwees naar een bestand dat niet bestond).
- **Kapotte of oude saves** laten de app niet meer crashen: ontbrekende velden worden aangevuld,
  onzinwaarden hersteld (`laadSave` in `state.tsx`).
- De toets kiest zijn 12 vragen nu écht willekeurig (eerlijk schudden in plaats van `sort(random)`).
- Dubbelklikken op "Terug naar school" na een live event telt het event niet meer twee keer.

### Valsspeel-lekken gedicht
- Huiswerk steeds in- en uitplannen leverde **onbeperkt XP en planningspunten** op. Nu krijg je de
  XP één keer en telt alleen het verschil tussen je oude en nieuwe keuze.
- De bonus-minigame van een huiswerkopdracht kon je eindeloos herhalen door de pagina te herladen.
  Die levert nu één keer XP op (wordt onthouden in je save).
- Tijdens de schooldag kon je je rugzak nog aanpassen. Nu zit hij dicht zodra de dag begint —
  zoals in het echt.
- Hetzelfde huiswerk of de toets kan niet twee keer meetellen.

### Nakijken van open vragen
- Antwoorden van een iPhone/iPad met "slimme" aanhalingstekens (`I’m`) worden goed gerekend.
- Het echte minteken (−), een punt aan het eind van een zin en spaties rond `=` en `/` maken niet meer uit.
- Autocorrectie en automatische hoofdletter staan uit in het antwoordveld.

### Inhoud
- Twee uitleggen bij werkwoordspelling waren fout ("s niet in 't kofschip" — de s zit er juist wél in).
  Nu: *verhuizen* → kijk naar de **z**, *bezorgd* → stam eindigt op **g**.
- Toetsvraag over ridders was dubbelzinnig; nu: "Wat moest een ridder doen in ruil voor zijn leen?"
- Het boek voor geschiedenis heet nu "Geschiedenisboek" in plaats van "Huiswerkboek".
- Niveaus bij het profiel: Vmbo basis/kader · Vmbo-tl/mavo · Havo/vwo.

### Kleinere verbeteringen
- 's Avonds laat de rugzakpagina zien wat je **morgen** nodig hebt.
- Het dashboard waarschuwt als je rugzak leeg of nog niet compleet is.
- Profiel: Enter werkt, naam wordt opgeschoond, duidelijke keuze voor je niveau.
- Foutpagina en 404 helemaal in het Nederlands.
- Toegankelijkheid: dialogen hebben `role="dialog"`, keuzeknoppen `aria-pressed`/`aria-checked`, labels bij invoervelden.

### Technisch
- Nieuw: `src/lib/game/antwoord.ts` (nakijken), `src/lib/game/random.ts` (schudden),
  `src/test/state-fixes.test.ts` (tests voor alle bovenstaande fixes).
- Nieuw script: `npm run typecheck`.
- Hele codebase geformatteerd met Prettier, zodat de Prettier-controle in `npm run lint` slaagt.
- README herschreven: wat de game is, hoe je hem draait en hoe de code in elkaar zit.

---

## 📢 Live events
Tijdens de schoolweek gebeurt er zomaar van alles. Elk event heeft een verhaal, regels, een eigen minigame,
een tip voor "in het echt" en effect op je vaardigheden (beter spelen = beter effect).

| Event | Minigame |
|---|---|
| 🔥 Brandalarm (altijd op di of wo) | Evacuatie: volg de groene vluchtroute, vermijd vuur, rook en de lift, red klasgenoten |
| ⚡ Stroomstoring | Zaklamp-zoektocht in de donkere kelder, pas op voor ratten |
| 🥪 Kantine-rush | Vang gezond eten, ontwijk energiedrank en snoep |
| ♻️ Prikdienst | Afval sorteren in papier / PMD / GFT / rest |
| ⚽ Pauzetoernooi | Penalty-shootout met richten en kracht |
| 🔐 Kluis op slot | Kluiskraker (code raden met 🟢/🟡-hints) |
| 🐝 Wesp in de klas | Vang de wesp, niet je klasgenoten |
| 🧑‍🏫 Mentoruur (maandag) | Rooster-memory: vak ↔ lokaal |
| 🚲 Bus rijdt niet | Dijk-fietser: ontwijk tractors, schapen en plassen |

Events worden aan het begin van de week ingepland (`planEvents` in `src/lib/game/events.ts`).

## 🧍 Lokaal zoeken in 3D (nieuw, standaard)
- First-person door de gangen lopen (raycasting op canvas, geen extra packages, ±60 fps).
- Elke vleugel heeft eigen kluisjeskleur: **A blauw, B roze, C groen**, met grote "VLEUGEL"-borden aan het eind van de gangen.
- Op elke deur staat het lokaalnummer; de deur van je doel licht zacht groen op.
- 🪧 Roosterpalen in de gangen: loop erheen om een roosterwijziging te zien (zonder strafminuten).
- Kompas met afstand, minikaart (uit te zetten voor extra uitdaging), voetstappen, deurgeluid, bel als je te laat bent.
- Besturing: ↑/W lopen, ←→/A D draaien, Shift rennen, slepen met muis of vinger om rond te kijken, knoppen op telefoon/tablet.
- De oude bovenaanzicht-versie is nog te kiezen via de knop "🗺️ Plattegrond" (keuze wordt onthouden).
- Kaartfix: de lokalen naast de westelijke hal hadden geen muur naar de hal toe.

## 🗺️ Schoolkaart (lokaal zoeken)
- De klok loopt echt: elke 3 seconden lopen = 1 minuut. Je kunt dus écht te laat komen.
- Medeleerlingen lopen door de gangen en stappen opzij als jij eraan komt (geen botsingen).
- De conciërge 🧑‍🔧 zegt er wat van als je bij hem rent (+1 minuut).
- Verkeerd lokaal? Je wordt teruggezet en krijgt +3 minuten (het spel gaat door).
- Roosterwijziging niet gecheckt? Dan vind je een **leeg lokaal met een briefje** en moet je door naar het nieuwe lokaal.
- Hoek-glijden: je blijft niet meer haken aan deuropeningen. Bugfix: de speler werd half doorzichtig met een zwarte vlek getekend.
- Na elke les heb je 5 minuten wisseltijd.

## 🎮 Huiswerk-minigames verbeterd
- Alle minigames hebben nu een timer, combo's, foutentelling, ⭐-sterren (0–3), bonus-XP en "nog een keer".
- Koppel: genummerde paren, shake bij fout. Rekenrace: aftelbalk, combo, juiste antwoord bij fout, `−` wordt herkend.
- Tijdlijn: hint-knop. Nieuw type **Sorteer** (← / → toetsen).
- Nieuw huiswerk: **Biologie — Kenmerken van leven** (minigame "Leeft het of niet?" + 10 vragen).

## 🕹️ Speelhal, levels en meer
- Nieuwe pagina `/spel/speelhal`: alle 11 minigames vrij spelen, records (blijven bewaard bij een nieuwe week), +5 XP per record.
- Levels met titels (Nieuwkomer → Martinus-meester), XP-popups en level-up-banner.
- Geluid aan/uit-knop (WebAudio, geen bestanden nodig).
- Omroep-ticker op het dashboard, live-event-overzicht, speelhal-kaart.
- 6 nieuwe badges: Brandweerheld, Kluiskraker, Alles overleefd, Speelhal-kampioen, Foutloos, Gangenraket.
- De toets kiest nu 12 willekeurige vragen uit een grotere set (o.a. brandalarm, biologie, conciërge).
- Eindrapport toont je live events met sterren.

## Technisch
- Nieuwe bestanden: `src/lib/game/events.ts`, `src/lib/game/sound.ts`, `src/components/game/LiveEventDialog.tsx`,
  `src/components/game/minigames/*`, `src/routes/spel.speelhal.tsx`, `src/test/live-events.test.tsx`.
- `src/routeTree.gen.ts` is bijgewerkt met de speelhal-route (wordt bij `vite dev` ook automatisch opnieuw gegenereerd).
- Oude opslag blijft werken (nieuwe velden krijgen standaardwaarden).
