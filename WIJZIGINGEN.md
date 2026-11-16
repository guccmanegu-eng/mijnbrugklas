# Wat is er nieuw in de Brugklas-game

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

## 🗺️ Schoolkaart (lokaal zoeken)
- De klok loopt echt: elke 3 seconden lopen = 1 minuut. Je kunt dus écht te laat komen.
- Medeleerlingen lopen door de gangen; botsen kost tijd.
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
