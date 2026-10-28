// Vérification des mots de passe de l'équipe et des codes famille, côté serveur.
// POST { role, code }                → { ok, jeton, nomIntervenant }   (équipe)
// POST { role: "famille", code }     → { ok, jeton, eleve_id }          (parents / apprenants pro)
// POST { action: "session", jeton }  → { ok, role, nomIntervenant }     (reconnexion après rafraîchissement)
//
// Variables Vercel (type Secret) :
//   CODE_DIRECTEUR, CODE_CA, CODE_ADMIN, CODE_SECRETARIAT, CODE_INTERVENANTS
//   CODES_INTERVENANTS_NOMMES   ex. :  Jean-Luc=xxxx;Spéro=yyyy;Youssou=zzzz   (facultatif)
const { createClient } = require("@supabase/supabase-js");
const { secret, attendre, egal, signer, lireJeton } = require("./_securite");

const DUREE_EQUIPE_MS = 12 * 60 * 60 * 1000;   // 12 h
const DUREE_FAMILLE_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

const codesRoles = () => ({
  directeur: process.env.CODE_DIRECTEUR,
  ca: process.env.CODE_CA,
  admin: process.env.CODE_ADMIN,
  secretariat: process.env.CODE_SECRETARIAT,
  formateur: process.env.CODE_INTERVENANTS,
});

const intervenantsNommes = () =>
  String(process.env.CODES_INTERVENANTS_NOMMES || "")
    .split(";")
    .map((x) => x.trim())
    .filter((x) => x.includes("="))
    .map((x) => {
      const i = x.indexOf("=");
      return { nom: x.slice(0, i).trim(), code: x.slice(i + 1).trim() };
    })
    .filter((x) => x.nom && x.code);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  if (!secret()) return res.status(500).json({ ok: false, message: "Secret de session manquant sur Vercel." });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  res.setHeader("Cache-Control", "no-store");

  // Reconnexion automatique (rafraîchissement de page)
  if (body.action === "session") {
    const p = lireJeton(body.jeton);
    if (!p || p.role === "famille") return res.status(401).json({ ok: false });
    return res.status(200).json({ ok: true, role: p.role, nomIntervenant: p.nom || "" });
  }

  const role = String(body.role || "");
  const code = String(body.code || "").trim();

  // ── Familles (parents, apprenants pro) : code personnel lié à un élève ──
  if (role === "famille") {
    if (code.length < 4 || code.length > 40) { await attendre(800); return res.status(401).json({ ok: false }); }
    const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: lien } = await sb.from("codes_parents").select("eleve_id").eq("code", code.toUpperCase()).maybeSingle();
    if (!lien) { await attendre(1000); return res.status(401).json({ ok: false }); }
    const jeton = signer({ role: "famille", eleve_id: lien.eleve_id, exp: Date.now() + DUREE_FAMILLE_MS });
    return res.status(200).json({ ok: true, jeton, eleve_id: lien.eleve_id });
  }

  // ── Équipe ──
  const codes = codesRoles();
  if (!(role in codes)) return res.status(400).json({ ok: false });

  let nom = "";
  let valide = false;
  if (codes[role] && egal(code, codes[role])) valide = true;
  if (!valide && role === "formateur") {
    const trouve = intervenantsNommes().find((x) => egal(code, x.code));
    if (trouve) { valide = true; nom = trouve.nom; }
  }
  if (!valide) {
    if (!codes[role] && !(role === "formateur" && intervenantsNommes().length)) {
      return res.status(500).json({ ok: false, message: "Mot de passe de cet espace non configuré sur Vercel." });
    }
    await attendre(1000);
    return res.status(401).json({ ok: false });
  }

  const jeton = signer({ role, nom, exp: Date.now() + DUREE_EQUIPE_MS });
  return res.status(200).json({ ok: true, jeton, nomIntervenant: nom });
};
