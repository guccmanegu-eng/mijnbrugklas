/**
 * Maakt een antwoord vergelijkbaar: hoofdletters, spaties, slimme aanhalingstekens
 * (iPhone/iPad), het echte minteken, € en leestekens aan het eind tellen niet mee.
 * Een decimale punt wordt een komma, zodat 3.46 en 3,46 allebei goed zijn.
 */
export const normaliseer = (s: string) =>
  s
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc`´]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2212\u2013\u2014]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/[€!?]/g, "")
    .trim()
    .replace(/[.,;:]+$/, "")
    .replace(/\./g, ",")
    .replace(/\s+/g, " ")
    .replace(/\s*([/=\-])\s*/g, "$1")
    .replace(/,00$/, "")
    .trim();
