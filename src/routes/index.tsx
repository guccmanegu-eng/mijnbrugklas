import { createFileRoute, Link } from "@tanstack/react-router";
import { BigButton, Card, Pill } from "@/components/game/bits";
import { SKILL_META, type SkillId } from "@/lib/game/data";
import logo from "@/assets/martinuscollege-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Brugklas Martinuscollege — oefen je eerste schoolweek in Grootebroek" },
      {
        name: "description",
        content:
          "Speel een hele schoolweek op het Martinuscollege in Grootebroek: rooster, lokalen als A2.21 en C0.04, huiswerk, planning, toetsen en echte keuzes.",
      },
      { property: "og:title", content: "Brugklas Martinuscollege — oefen het voordat het echt begint" },
      {
        property: "og:description",
        content:
          "Een veilige oefenweek op het Martinuscollege Grootebroek. Geen echte onvoldoendes, wel echte keuzes en echte gevolgen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const STAPPEN = [
  {
    icon: "📋",
    titel: "Je krijgt een rooster",
    tekst: "Vijf dagen, echte Martinus-lokalen: A0.02, B1.12, C2.06. Niemand loopt met je mee.",
  },
  {
    icon: "🎒",
    titel: "Je pakt zelf je rugzak",
    tekst: "Verkeerde boeken mee? Dan merk je dat in de les — precies zoals in het echt.",
  },
  {
    icon: "⏰",
    titel: "Je moet op tijd zijn",
    tekst: "Nog 3 minuten en jij staat in A0.02 terwijl je les in C0.04 is. Rennen of denken?",
  },
  {
    icon: "📅",
    titel: "Je plant je huiswerk zelf",
    tekst: "Maandag opgegeven, woensdag inleveren. Jij kiest wanneer je het maakt.",
  },
];

function Home() {
  const skills = Object.keys(SKILL_META) as SkillId[];

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:py-5">
        <span className="flex min-w-0 items-center gap-3">
          <img
            src={logo.url}
            alt="Martinuscollege Grootebroek"
            className="h-16 w-auto shrink-0 wiggle-hover sm:h-20"
          />
          <span className="hidden leading-tight sm:block">
            <span className="block text-lg font-extrabold">Brugklas-game</span>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-rose">
              Grootebroek
            </span>
          </span>
        </span>
        <Link to="/profiel" className="text-sm font-semibold text-brand hover:underline">
          Start de week →
        </Link>
      </header>

      <main>
        <section className="mx-auto w-full max-w-5xl px-5 pb-16 pt-8 sm:pt-14">
          <div className="flex flex-wrap gap-2">
            <Pill tone="brand">🎉 Voor groep 8</Pill>
            <Pill tone="good">📍 Martinuscollege Grootebroek</Pill>
            <Pill tone="warn">🕹️ Spelenderwijs oefenen</Pill>
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Overleef jij een week op het{" "}
            <span className="text-brand">Martinuscollege</span>? 🎒
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Vijf dagen, zeven lesuren, lokalen van A0.02 tot C2.06 en een rugzak die je zélf
            inpakt. Kom je te laat, vergeet je je boek of plan je slim? Jij beslist — de school
            fluistert niets voor.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:max-w-md sm:flex-row">
            <Link to="/profiel" className="flex-1">
              <BigButton>🚀 Start je Martinus-week →</BigButton>
            </Link>
            <Link to="/spel" className="flex-1">
              <BigButton variant="ghost">Verder waar je was</BigButton>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Geen echte onvoldoendes, geen strafwerk. Wel echte keuzes, XP en badges. 🏅
          </p>
        </section>

        <section className="mx-auto w-full max-w-5xl px-5 pb-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Zo ziet jouw week op het Martinus eruit 👀</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {STAPPEN.map((s) => (
              <Card key={s.titel} className="wiggle-hover h-full animate-pop-in">
                <p className="text-3xl">{s.icon}</p>
                <h3 className="mt-3 text-lg font-bold">{s.titel}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.tekst}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-5 pb-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Aan het eind verdien je je Martinus-rapport ⭐</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Je ziet niet alleen of je de week hebt gehaald, maar ook waar je al goed in bent en wat
            je nog kunt oefenen.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {skills.map((k) => (
              <Card key={k} className="wiggle-hover flex items-center gap-3">
                <span className="text-2xl">{SKILL_META[k].icon}</span>
                <span className="text-sm font-bold">{SKILL_META[k].naam}</span>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-5 pb-20">
          <Card className="bg-confetti bg-brand/8 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Oefen het voordat het echt begint 🎈</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Straks loop jij zelf van A0.02 naar C1.03. Hier oefen je dat alvast — met plezier,
              zonder zenuwen.
            </p>
            <Link to="/profiel" className="mx-auto mt-6 block max-w-xs">
              <BigButton>✏️ Maak je profiel →</BigButton>
            </Link>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        🎒 Brugklas · Martinuscollege Grootebroek — oefen het voordat het echt begint.
      </footer>
    </div>
  );
}
