// Billetterie Cirque en Fusion 2026 — création de commande + paiement FedaPay
// POST { festival, items:[{slug, quantite}], acheteur:{prenom, nom, telephone, email} } → { url }
// POST { action: "verifier", commande, cle } → { status }  (filet de sécurité si le webhook tarde)
//
// Variables Vercel utilisées : FEDAPAY_SECRET_KEY, FEDAPAY_ENV (déjà en place),
// REACT_APP_SUPABASE_URL (déjà en place), SUPABASE_SERVICE_ROLE_KEY (à ajouter, jamais côté navigateur).
const { FedaPay, Transaction } = require("fedapay");
const { createClient } = require("@supabase/supabase-js");

const admin = () =>
  createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

const initFedaPay = () => {
  FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
  FedaPay.setEnvironment(process.env.FEDAPAY_ENV || "live");
};

const nettoyerTel = (t) => {
  let d = String(t || "").replace(/\D/g, "");
  if (d.startsWith("229") && d.length > 10) d = d.slice(3);
  return d;
};

// Relit le statut réel chez FedaPay et met la commande à jour
async function synchroniser(sb, orderId, transactionId) {
  initFedaPay();
  const tx = await Transaction.retrieve(transactionId);
  if (tx.status === "approved" || tx.status === "transferred") {
    const { error } = await sb.rpc("mark_festival_order_paid", { p_order_id: orderId });
    if (error) throw error;
    return "paid";
  }
  if (tx.status === "declined") {
    await sb.from("festival_orders").update({ status: "failed" }).eq("id", orderId).eq("status", "pending");
    return "failed";
  }
  if (tx.status === "canceled" || tx.status === "expired") {
    await sb.from("festival_orders").update({ status: "cancelled" }).eq("id", orderId).eq("status", "pending");
    return "cancelled";
  }
  return "pending";
}

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Méthode non autorisée" });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ message: "Billetterie pas encore configurée (clé Supabase manquante sur Vercel)." });
  }
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const sb = admin();

  // --- Vérification d'une commande existante ---
  if (body.action === "verifier") {
    const { data: o } = await sb
      .from("festival_orders")
      .select("id, status, fedapay_transaction_id")
      .eq("id", body.commande)
      .eq("access_key", body.cle)
      .maybeSingle();
    if (!o) return res.status(404).json({ message: "Commande introuvable" });
    if (o.status !== "pending" || !o.fedapay_transaction_id) return res.status(200).json({ status: o.status });
    try {
      return res.status(200).json({ status: await synchroniser(sb, o.id, o.fedapay_transaction_id) });
    } catch (e) {
      console.error(e);
      return res.status(200).json({ status: "pending" });
    }
  }

  // --- Nouvelle commande ---
  const a = body.acheteur || {};
  const prenom = String(a.prenom || "").trim().slice(0, 80);
  const nom = String(a.nom || "").trim().slice(0, 80);
  const telephone = nettoyerTel(a.telephone);
  const email = a.email ? String(a.email).trim().slice(0, 160) : null;
  if (!prenom || !nom || telephone.length < 8) {
    return res.status(400).json({ message: "Nom, prénom et téléphone sont obligatoires." });
  }
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 10) {
    return res.status(400).json({ message: "Panier invalide." });
  }

  const { data: cmd, error } = await sb.rpc("create_festival_order", {
    p_festival: "cef-2026",
    p_items: body.items.map((i) => ({ slug: String(i.slug), quantite: Number(i.quantite) })),
    p_firstname: prenom,
    p_lastname: nom,
    p_phone: telephone,
    p_email: email,
  });
  if (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de la commande. Réessayez." });
  }
  if (cmd.error) return res.status(409).json({ message: cmd.error });

  const site = process.env.SITE_URL || "https://" + req.headers.host;
  const retour = `${site}/cirque-en-fusion-2026/billets?commande=${cmd.order_id}&cle=${cmd.access_key}`;

  try {
    initFedaPay();
    const customer = { firstname: prenom, lastname: nom, phone_number: { number: telephone, country: "bj" } };
    if (email) customer.email = email;

    const transaction = await Transaction.create({
      description: cmd.description.slice(0, 250),
      amount: cmd.total_fcfa,
      currency: { iso: "XOF" },
      callback_url: retour,
      customer,
      custom_metadata: { festival: "cef-2026", festival_order_id: cmd.order_id },
    });
    const token = await transaction.generateToken();

    await sb.from("festival_orders").update({ fedapay_transaction_id: transaction.id }).eq("id", cmd.order_id);
    return res.status(200).json({ url: token.url, commande: cmd.order_id });
  } catch (e) {
    console.error(e);
    await sb.from("festival_orders").update({ status: "failed" }).eq("id", cmd.order_id);
    return res.status(502).json({ message: "Le service de paiement ne répond pas. Réessayez dans quelques minutes." });
  }
}

module.exports = handler;
module.exports.synchroniser = synchroniser;
