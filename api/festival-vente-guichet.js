// Vente de billets sur place par l'équipe (espèces ou Mobile Money reçu directement)
// POST { spectacle, quantite, prenom, nom, telephone, mode }  + laissez-passer de l'équipe (Authorization: Bearer …)
// → crée la commande, la marque payée, génère les billets (QR codes) et l'inscrit en caisse.
const { createClient } = require("@supabase/supabase-js");
const { jetonDeRequete } = require("./_securite");

const VENDEURS = { directeur: "Direction", admin: "Administration", secretariat: "Secrétariat" };
const MODES = { especes: "Espèces", momo: "Mobile Money direct" };
const court = (v, n) => String(v == null ? "" : v).trim().slice(0, n);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Méthode non autorisée" });
  res.setHeader("Cache-Control", "no-store");
  const p = jetonDeRequete(req);
  if (!p || !VENDEURS[p.role]) return res.status(401).json({ message: "Session expirée, reconnectez-vous." });

  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const spectacle = court(b.spectacle, 60);
  const quantite = Number(b.quantite);
  const prenom = court(b.prenom, 80);
  const nom = court(b.nom, 80);
  const telephone = court(b.telephone, 40).replace(/[^\d+ ]/g, "");
  const mode = MODES[b.mode] ? b.mode : "especes";
  if (!spectacle || !Number.isInteger(quantite) || quantite < 1 || quantite > 10) {
    return res.status(400).json({ message: "Choisissez un spectacle et 1 à 10 places." });
  }
  if (!nom) return res.status(400).json({ message: "Le nom de l'acheteur est obligatoire." });

  const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const vendeur = VENDEURS[p.role] + (p.nom ? " · " + p.nom : "");

  const { data: cmd, error } = await sb.rpc("create_festival_order", {
    p_festival: "cef-2026",
    p_items: [{ slug: spectacle, quantite }],
    p_firstname: prenom, p_lastname: nom, p_phone: telephone, p_email: null,
  });
  if (error) { console.error(error); return res.status(500).json({ message: "Erreur lors de la vente. Réessayez." }); }
  if (cmd.error) return res.status(409).json({ message: cmd.error });

  const { error: e2 } = await sb.from("festival_orders").update({ mode_paiement: mode, vendu_par: vendeur }).eq("id", cmd.order_id);
  const { error: e3 } = await sb.rpc("mark_festival_order_paid", { p_order_id: cmd.order_id });
  if (e2 || e3) {
    console.error(e2 || e3);
    await sb.from("festival_orders").update({ status: "failed" }).eq("id", cmd.order_id);
    return res.status(500).json({ message: "Erreur lors de l'émission des billets. Réessayez." });
  }

  // Inscription en caisse (Trésorerie). En cas d'échec, la vente reste valable.
  try {
    await sb.from("operations_caisse").insert([{
      date: new Date().toISOString().slice(0, 10),
      projet: "Festival Cirque en Fusion", sens: "entree",
      compte_caisse: "571", compte_contrepartie: "706", compte_debit: "571", compte_credit: "706",
      montant: cmd.total_fcfa,
      libelle: `Billetterie festival — ${cmd.description.replace("Cirque en Fusion 2026 – ", "")} (${MODES[mode]}) — ${[prenom, nom].filter(Boolean).join(" ")}`,
      saisi_par: vendeur,
    }]);
  } catch (e) { console.error(e); }

  return res.status(200).json({ ok: true, commande: cmd.order_id, cle: cmd.access_key, total: cmd.total_fcfa });
};
