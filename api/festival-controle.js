// Contrôle des billets à l'entrée — Cirque en Fusion 2026
// POST { code, action: "evenements" }                    → { evenements: [{slug, titre, date_label, vendus, entres}] }
// POST { code, action: "scanner", billet, spectacle }     → { statut, titre, date_label, acheteur, scanned_at, compteur }
// Code accepté : FESTIVAL_CONTROLE_CODE (code des portiers, facultatif) ou FESTIVAL_EQUIPE_CODE.
const { createClient } = require("@supabase/supabase-js");

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

async function compteurs(sb) {
  const [{ data: evts }, { data: billets }] = await Promise.all([
    sb.from("festival_events").select("id, slug, titre, date_label, starts_at").eq("festival", "cef-2026").order("starts_at"),
    sb.from("festival_tickets").select("event_id, scanned_at").limit(20000),
  ]);
  const c = {};
  (billets || []).forEach((b) => {
    c[b.event_id] = c[b.event_id] || { vendus: 0, entres: 0 };
    c[b.event_id].vendus += 1;
    if (b.scanned_at) c[b.event_id].entres += 1;
  });
  return (evts || []).map((e) => ({
    slug: e.slug, titre: e.titre, date_label: e.date_label,
    vendus: (c[e.id] || {}).vendus || 0, entres: (c[e.id] || {}).entres || 0,
  }));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Méthode non autorisée" });
  res.setHeader("Cache-Control", "no-store");

  const codes = [process.env.FESTIVAL_CONTROLE_CODE, process.env.FESTIVAL_EQUIPE_CODE].filter(Boolean);
  if (!codes.length) return res.status(500).json({ message: "Code de contrôle non configuré sur Vercel." });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ message: "Clé Supabase serveur manquante sur Vercel." });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  if (!codes.includes(String(body.code || ""))) {
    await attendre(800);
    return res.status(401).json({ message: "Code incorrect" });
  }

  const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  if (body.action === "evenements") {
    return res.status(200).json({ evenements: await compteurs(sb) });
  }

  if (body.action === "scanner") {
    let billet = String(body.billet || "").trim().toUpperCase().replace(/\s+/g, "");
    if (billet && !billet.startsWith("CEF26-")) billet = "CEF26-" + billet.replace(/^CEF26/, "");
    if (!/^CEF26-[A-F0-9]{10}$/.test(billet)) return res.status(200).json({ statut: "inconnu" });

    const { data, error } = await sb.rpc("checkin_festival_ticket", { p_code: billet, p_event_slug: body.spectacle || "" });
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Erreur de vérification. Réessayez." });
    }
    const evenements = await compteurs(sb);
    const courant = evenements.find((e) => e.slug === body.spectacle);
    return res.status(200).json({ ...data, billet, compteur: courant || null });
  }

  return res.status(400).json({ message: "Action inconnue" });
};
