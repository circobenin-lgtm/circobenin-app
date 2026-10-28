// Sert l'adresse /cirque-en-fusion-2026 avec sa propre fiche de partage (aperçu WhatsApp, Facebook…).
// La page reste la même application : on reprend index.html et on remplace seulement titre, description et image.
const SITE = "https://app.circobenin.com";
const TITRE = "Cirque en Fusion 2026 · 25–28 novembre · Cotonou";
const DESCRIPTION = "Festival international des arts du cirque : 11 compagnies, 56 artistes, 4 jours de spectacles, ateliers et village à Agla. Programme et billetterie en ligne.";
const IMAGE = SITE + "/og-cirque-en-fusion-2026.jpg";

const echapper = (t) => String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const META = `
    <title>${echapper(TITRE)}</title>
    <meta name="description" content="${echapper(DESCRIPTION)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Circo Bénin" />
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:url" content="${SITE}/cirque-en-fusion-2026" />
    <meta property="og:title" content="${echapper(TITRE)}" />
    <meta property="og:description" content="${echapper(DESCRIPTION)}" />
    <meta property="og:image" content="${IMAGE}" />
    <meta property="og:image:secure_url" content="${IMAGE}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Festival Cirque en Fusion #3 — 25 au 28 novembre 2026, Cotonou" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${echapper(TITRE)}" />
    <meta name="twitter:description" content="${echapper(DESCRIPTION)}" />
    <meta name="twitter:image" content="${IMAGE}" />
`;

module.exports = async function handler(req, res) {
  let html;
  try {
    const rep = await fetch(`https://${req.headers.host}/index.html`, { headers: { "x-og-festival": "1" } });
    html = await rep.text();
  } catch (e) {
    html = null;
  }
  if (!html || !html.includes("<head")) {
    res.setHeader("Location", "/index.html");
    return res.status(302).end();
  }
  html = html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+(?:name|property)="(?:description|og:[^"]*|twitter:[^"]*)"[^>]*>/gi, "")
    .replace(/<head([^>]*)>/i, `<head$1>${META}`);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=600, stale-while-revalidate=86400");
  return res.status(200).send(html);
};
