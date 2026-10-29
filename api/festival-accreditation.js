// Formulaire « Accréditations & influenceurs » de la page Cirque en Fusion 2026
// POST { type, prenom, nom, structure, fonction, email, telephone, ville, plateformes, lien, abonnes, jours, message, site }
const { createClient } = require("@supabase/supabase-js");

const TYPES = { professionnel: "Professionnel", presse: "Presse / média", influenceur: "Influenceur / créateur de contenu" };
const court = (v, n = 200) => String(v == null ? "" : v).trim().slice(0, n);
const echapper = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Méthode non autorisée" });
  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  if (b.site) return res.status(200).json({ ok: true }); // champ piège anti-robots

  const d = {
    type: court(b.type, 20), prenom: court(b.prenom, 80), nom: court(b.nom, 80),
    structure: court(b.structure, 150), fonction: court(b.fonction, 120), email: court(b.email, 160),
    telephone: court(b.telephone, 40), ville: court(b.ville, 120), plateformes: court(b.plateformes, 200),
    lien: court(b.lien, 300), abonnes: court(b.abonnes, 40), jours: court(b.jours, 120), message: court(b.message, 1500),
  };
  if (!TYPES[d.type]) return res.status(400).json({ message: "Choisissez un type de demande." });
  if (!d.prenom || !d.nom || d.telephone.replace(/\D/g, "").length < 8) {
    return res.status(400).json({ message: "Prénom, nom et téléphone sont obligatoires." });
  }
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return res.status(400).json({ message: "Adresse e-mail invalide." });
  if (d.type === "influenceur" && (!d.plateformes || !d.lien)) {
    return res.status(400).json({ message: "Indiquez vos réseaux et le lien de votre compte principal." });
  }

  const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { error } = await sb.from("festival_accreditations").insert([{ ...d, email: d.email || null }]);
  if (error) {
    console.error(error);
    return res.status(500).json({ message: "Envoi impossible pour le moment. Réessayez ou écrivez à circobenin@gmail.com." });
  }

  // Alerte e-mail à l'équipe (si l'envoi échoue, la demande reste enregistrée)
  if (process.env.RESEND_API_KEY) {
    const lignes = [
      ["Type", TYPES[d.type]], ["Nom", `${d.prenom} ${d.nom}`], ["Structure / média", d.structure], ["Fonction", d.fonction],
      ["Téléphone", d.telephone], ["E-mail", d.email], ["Ville / pays", d.ville], ["Réseaux", d.plateformes],
      ["Lien", d.lien], ["Abonnés", d.abonnes], ["Jours de présence", d.jours], ["Message", d.message],
    ].filter(([, v]) => v);
    const html = `<h2>Nouvelle demande d'accréditation — Cirque en Fusion 2026</h2><table>${lignes
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td style="padding:4px 0"><b>${echapper(v)}</b></td></tr>`).join("")}</table>
      <p>Retrouvez toutes les demandes dans l'app : Billetterie festival → Accréditations.</p>`;
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "Circo Benin <accueil@circobenin.com>",
          to: ["circobenin@gmail.com"],
          reply_to: d.email || undefined,
          subject: `Accréditation ${TYPES[d.type]} — ${d.prenom} ${d.nom}`,
          html,
        }),
      });
    } catch (e) { console.error(e); }
  }
  return res.status(200).json({ ok: true });
};
