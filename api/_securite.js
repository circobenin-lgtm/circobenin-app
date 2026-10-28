// Outils partagés : laissez-passer (jetons signés) de l'app Circo Bénin.
// Fichier préfixé « _ » : Vercel ne le publie pas comme adresse, il sert seulement aux autres fonctions.
const crypto = require("crypto");

const secret = () => process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

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
  if (!corps || !sig || !secret()) return null;
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

const jetonDeRequete = (req) => {
  const h = String(req.headers.authorization || "");
  return h.startsWith("Bearer ") ? lireJeton(h.slice(7)) : null;
};

module.exports = { secret, attendre, egal, signer, lireJeton, jetonDeRequete };
