// Vérification des mots de passe de l'équipe côté serveur (ils ne sont plus dans le code du site)
// POST { role, code }            → { ok, jeton, nomIntervenant }
// POST { action: "session", jeton } → { ok, role, nomIntervenant }   (reconnexion après rafraîchissement)
//
// Variables Vercel (type Secret) :
//   CODE_DIRECTEUR, CODE_CA, CODE_ADMIN, CODE_SECRETARIAT, CODE_INTERVENANTS
//   CODES_INTERVENANTS_NOMMES   ex. :  Jean-Luc=xxxx;Spéro=yyyy;Youssou=zzzz   (facultatif)
const crypto = require("crypto");

const DUREE_JETON_MS = 12 * 60 * 60 * 1000; // 12 h, puis reconnexion obligatoire
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const secret = () => process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

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

// comparaison à temps constant
const egal = (a, b) => {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

const signer = (payload) => {
  const corps = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(corps).digest("base64url");
  return `${corps}.${sig}`;
};

const lireJeton = (jeton) => {
  const [corps, sig] = String(jeton || "").split(".");
  if (!corps || !sig) return null;
  const attendu = crypto.createHmac("sha256", secret()).update(corps).digest("base64url");
  if (!egal(sig, attendu)) return null;
  try {
    const p = JSON.parse(Buffer.from(corps, "base64url").toString("utf8"));
    if (!p.exp || Date.now() > p.exp) return null;
    return p;
  } catch (e) {
    return null;
  }
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  if (!secret()) return res.status(500).json({ ok: false, message: "Secret de session manquant sur Vercel." });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  res.setHeader("Cache-Control", "no-store");

  // Reconnexion automatique (rafraîchissement de page)
  if (body.action === "session") {
    const p = lireJeton(body.jeton);
    if (!p) return res.status(401).json({ ok: false });
    return res.status(200).json({ ok: true, role: p.role, nomIntervenant: p.nom || "" });
  }

  const role = String(body.role || "");
  const code = String(body.code || "");
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
    await attendre(1000); // freine les essais à la chaîne
    return res.status(401).json({ ok: false });
  }

  const jeton = signer({ role, nom, exp: Date.now() + DUREE_JETON_MS });
  return res.status(200).json({ ok: true, jeton, nomIntervenant: nom });
};
