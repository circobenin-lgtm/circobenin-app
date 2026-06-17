const { FedaPay, Transaction, Webhook } = require("fedapay");

// Désactive le body parser automatique de Vercel : la vérification de signature
// FedaPay nécessite le corps brut (raw) de la requête, pas du JSON déjà reparsé.
export const config = {
  api: {
    bodyParser: false,
  },
};

function lireCorpsBrut(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const sig = req.headers["x-fedapay-signature"];
  const endpointSecret = process.env.FEDAPAY_WEBHOOK_SECRET;

  let rawBody;
  let event;
  try {
    rawBody = await lireCorpsBrut(req);
    event = Webhook.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    return res.status(400).json({ error: "Signature invalide: " + err.message });
  }

  try {
    if (event.name !== "transaction.approved") {
      // On accuse réception sans rien faire pour les autres types d'événements
      // (transaction.created, transaction.canceled, etc.)
      return res.status(200).json({ received: true, ignored: event.name });
    }

    const transactionId = event.entity.id;

    // On ne fait jamais confiance au seul contenu du webhook pour le montant :
    // on récupère la transaction depuis l'API FedaPay pour confirmation.
    FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
    FedaPay.setEnvironment(process.env.FEDAPAY_ENV || "live");
    const transaction = await Transaction.retrieve(transactionId);

    if (transaction.status !== "approved") {
      return res.status(200).json({ received: true, ignored: "statut non approuvé: " + transaction.status });
    }

    const eleveId = transaction.custom_metadata && transaction.custom_metadata.eleve_id;
    if (!eleveId) {
      return res.status(400).json({ error: "eleve_id manquant dans les métadonnées de la transaction" });
    }

    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_KEY);

    // Évite le double-traitement si FedaPay renvoie le même webhook plusieurs fois
    const { data: dejaTraite } = await supabase
      .from("versements_eleves")
      .select("id")
      .eq("fedapay_transaction_id", transactionId)
      .maybeSingle();
    if (dejaTraite) {
      return res.status(200).json({ received: true, ignored: "déjà traité" });
    }

    const { data: eleve } = await supabase.from("eleves").select("nom, prenom").eq("id", eleveId).maybeSingle();
    const nomEleve = eleve ? eleve.prenom + " " + eleve.nom : "Élève";
    const dateVersement = new Date().toISOString().slice(0, 10);
    const montant = transaction.amount;

    await supabase.from("versements_eleves").insert([{
      eleve_id: eleveId, eleve_nom: nomEleve, montant,
      mode: "FedaPay", date: dateVersement,
      fedapay_transaction_id: transactionId,
    }]);

    await supabase.from("operations_caisse").insert([{
      date: dateVersement, projet: "Circo Bénin — fonctionnement", sens: "entree",
      compte_caisse: "571", compte_contrepartie: "706",
      compte_debit: "571", compte_credit: "706",
      montant, libelle: "Versement cotisation — " + nomEleve + " (FedaPay)",
      saisi_par: "FedaPay (automatique)",
    }]);

    res.status(200).json({ received: true, montant, eleveId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
