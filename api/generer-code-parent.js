// Génère (ou répare) le code d'accès parent pour un élève, côté serveur.
// Utilise la clé service_role (jamais exposée au navigateur) pour contourner
// les policies RLS sur codes_parents, qui bloquaient l'écriture depuis le
// client avec la clé anon.
const { createClient } = require("@supabase/supabase-js");

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY non configurée sur le serveur." });
    }

    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const { eleveId, prenom, dateNaissance } = body || {};
    if (!eleveId || !prenom) {
      return res.status(400).json({ error: "eleveId et prenom sont requis." });
    }

    const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, serviceKey);

    const lettres = String(prenom)
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toUpperCase().replace(/[^A-Z]/g, "");
    const annee = dateNaissance ? new Date(dateNaissance).getFullYear() : new Date().getFullYear();
    const base = lettres + annee;

    let code = base;
    let suffixe = 2;
    while (true) {
      const { data: existant, error: errSelect } = await supabase
        .from("codes_parents").select("code").eq("code", code).maybeSingle();
      if (errSelect) return res.status(500).json({ error: errSelect.message });
      if (!existant) break;
      code = base + "-" + suffixe;
      suffixe++;
    }

    const { error: errInsert } = await supabase
      .from("codes_parents").insert([{ code, eleve_id: eleveId }]);
    if (errInsert) return res.status(500).json({ error: errInsert.message });

    return res.status(200).json({ code });
  } catch (e) {
    return res.status(500).json({ error: (e && e.message) || "Erreur inconnue." });
  }
}
