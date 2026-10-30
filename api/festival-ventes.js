// Ventes de la billetterie Cirque en Fusion 2026, pour l'équipe (Direction / Administration / Secrétariat)
// POST { code } → { totaux, evenements, commandes }
// Protégé par la variable Vercel FESTIVAL_EQUIPE_CODE (jamais envoyée au navigateur).
const { createClient } = require("@supabase/supabase-js");

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Méthode non autorisée" });

  const attendu = process.env.FESTIVAL_EQUIPE_CODE;
  if (!attendu) return res.status(500).json({ message: "Code billetterie non configuré sur Vercel (FESTIVAL_EQUIPE_CODE)." });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ message: "Clé Supabase serveur manquante sur Vercel." });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  if (String(body.code || "") !== attendu) {
    await attendre(800); // freine les essais de code à la chaîne
    return res.status(401).json({ message: "Code incorrect" });
  }

  const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const [{ data: evts, error: e1 }, { data: cmds, error: e2 }] = await Promise.all([
    sb.from("festival_events")
      .select("id, slug, titre, date_label, prix_fcfa, capacite, starts_at")
      .eq("festival", "cef-2026")
      .order("starts_at"),
    sb.from("festival_orders")
      .select("id, access_key, created_at, paid_at, expires_at, buyer_firstname, buyer_lastname, buyer_phone, buyer_email, total_fcfa, status, mode_paiement, vendu_par, festival_order_items(quantite, prix_unitaire, event_id)")
      .eq("festival", "cef-2026")
      .order("created_at", { ascending: false })
      .limit(3000),
  ]);
  if (e1 || e2) {
    console.error(e1 || e2);
    return res.status(500).json({ message: "Erreur de lecture des ventes." });
  }

  const maintenant = Date.now();
  const parId = Object.fromEntries(evts.map((e) => [e.id, { ...e, vendus: 0, attente: 0, recette: 0 }]));
  const totaux = { encaisse_en_ligne: 0, encaisse_sur_place: 0, encaisse: 0, billets: 0, commandes_payees: 0, commandes_attente: 0, restantes: 0 };

  const commandes = cmds.map((o) => {
    const enAttente = o.status === "pending" && new Date(o.expires_at).getTime() > maintenant;
    const statut = o.status === "pending" && !enAttente ? "expired" : o.status;
    const lignes = (o.festival_order_items || []).map((i) => {
      const ev = parId[i.event_id];
      if (ev && statut === "paid") { ev.vendus += i.quantite; ev.recette += i.quantite * i.prix_unitaire; totaux.billets += i.quantite; }
      if (ev && statut === "pending") ev.attente += i.quantite;
      return { titre: ev ? ev.titre : "?", quantite: i.quantite };
    });
    if (statut === "paid") { totaux.encaisse += o.total_fcfa; totaux.commandes_payees += 1; if (o.mode_paiement && o.mode_paiement !== "fedapay") totaux.encaisse_sur_place += o.total_fcfa; else totaux.encaisse_en_ligne += o.total_fcfa; }
    if (statut === "pending") totaux.commandes_attente += 1;
    return {
      id: o.id, access_key: o.access_key, cree_le: o.created_at, paye_le: o.paid_at,
      prenom: o.buyer_firstname, nom: o.buyer_lastname, telephone: o.buyer_phone, email: o.buyer_email,
      total: o.total_fcfa, statut, lignes, mode_paiement: o.mode_paiement, vendu_par: o.vendu_par,
    };
  });

  const evenements = evts.map((e) => {
    const x = parId[e.id];
    const restants = Math.max(0, x.capacite - x.vendus - x.attente);
    totaux.restantes += restants;
    return { slug: x.slug, titre: x.titre, date_label: x.date_label, prix_fcfa: x.prix_fcfa, capacite: x.capacite, vendus: x.vendus, attente: x.attente, restants, recette: x.recette };
  });

  res.setHeader("Cache-Control", "no-store");
  const { data: accreditations } = await sb.from("festival_accreditations")
    .select("*").eq("festival", "cef-2026").order("created_at", { ascending: false }).limit(1000);
  return res.status(200).json({ genere_le: new Date().toISOString(), totaux, evenements, commandes, accreditations: accreditations || [] });
};
