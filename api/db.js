// Guichet sécurisé entre l'app et la base Supabase.
// Chaque requête doit porter un laissez-passer (jeton signé, remis à la connexion).
//   • Équipe (direction, CA, administration, secrétariat, intervenants) : accès aux tables de l'app.
//   • Famille (parent / apprenant pro) : uniquement les données de SON élève.
//   • Sans laissez-passer : aucun accès.
const { createClient } = require("@supabase/supabase-js");
const { jetonDeRequete } = require("./_securite");

const ROLES_EQUIPE = ["directeur", "ca", "admin", "secretariat", "formateur"];

const TABLES_EQUIPE = [
  "adhesions", "annonces", "assignations_cours", "codes_parents", "comptes_paiement", "cours",
  "demandes_creneau", "echeances_dette", "eleves", "emprunts", "messages", "messages_famille",
  "operations_caisse", "paiements", "paies_intervenants", "pointages_heures", "preinscriptions",
  "preinscriptions_stages", "presences", "presences_seances", "projets", "remboursements_emprunt",
  "spectacles", "dates_spectacles", "artistes", "taux_horaire_intervenants",
];

// Ce qu'une famille peut faire, table par table, et la colonne qui la lie à son élève
const REGLES_FAMILLE = {
  eleves: { colonne: "id", ops: ["select"] },
  comptes_paiement: { colonne: "eleve_id", ops: ["select"] },
  versements_eleves: { colonne: "eleve_id", ops: ["select"] },
  demandes_creneau: { colonne: "eleve_id", ops: ["select", "insert"] },
  messages_famille: { colonne: "eleve_id", ops: ["select", "insert", "update"], champsModifiables: ["lu"] },
};
TABLES_EQUIPE.push("versements_eleves");

const OPS = ["select", "insert", "update", "upsert", "delete"];
const FILTRES = ["eq", "neq", "gt", "gte", "lt", "lte", "in", "is", "like", "ilike"];
const COLONNE_OK = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const SELECTION_SIMPLE = /^[a-zA-Z0-9_,\s*]+$/; // pas de jointures pour les familles

const refuser = (res, code, message) => res.status(code).json({ data: null, error: { message } });

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return refuser(res, 405, "Méthode non autorisée");
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return refuser(res, 500, "Clé Supabase serveur manquante");

  const p = jetonDeRequete(req);
  if (!p) return refuser(res, 401, "Session expirée, reconnectez-vous.");

  const q = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const { table, op } = q;
  const filtres = Array.isArray(q.filtres) ? q.filtres : [];
  const ordre = Array.isArray(q.ordre) ? q.ordre : [];
  if (!OPS.includes(op)) return refuser(res, 400, "Opération inconnue");
  for (const f of filtres) {
    if (!Array.isArray(f) || !FILTRES.includes(f[0]) || !COLONNE_OK.test(String(f[1]))) return refuser(res, 400, "Filtre invalide");
  }
  for (const o of ordre) {
    if (!Array.isArray(o) || !COLONNE_OK.test(String(o[0]))) return refuser(res, 400, "Tri invalide");
  }
  if ((op === "update" || op === "delete") && filtres.length === 0) return refuser(res, 400, "Modification sans filtre refusée");

  const estEquipe = ROLES_EQUIPE.includes(p.role);
  const estFamille = p.role === "famille" && p.eleve_id;
  let filtresFinal = filtres;

  if (estEquipe) {
    if (!TABLES_EQUIPE.includes(table)) return refuser(res, 403, "Table non autorisée");
  } else if (estFamille) {
    const regle = REGLES_FAMILLE[table];
    if (!regle || !regle.ops.includes(op)) return refuser(res, 403, "Accès non autorisé");
    if (q.colonnes && !SELECTION_SIMPLE.test(String(q.colonnes))) return refuser(res, 403, "Sélection non autorisée");
    if (q.retour && !SELECTION_SIMPLE.test(String(q.retour))) return refuser(res, 403, "Sélection non autorisée");
    // la famille ne voit / ne modifie que son élève
    filtresFinal = [...filtres, ["eq", regle.colonne, p.eleve_id]];
    if (op === "insert") {
      const lignes = Array.isArray(q.valeurs) ? q.valeurs : [q.valeurs];
      if (!lignes.length || lignes.some((l) => !l || String(l[regle.colonne]) !== String(p.eleve_id))) {
        return refuser(res, 403, "Élève non autorisé");
      }
    }
    if (op === "update") {
      const champs = Object.keys(q.valeurs || {});
      if (!champs.length || champs.some((c) => !(regle.champsModifiables || []).includes(c))) {
        return refuser(res, 403, "Modification non autorisée");
      }
    }
  } else {
    return refuser(res, 403, "Accès non autorisé");
  }

  const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  let r = sb.from(table);
  if (op === "select") r = r.select(q.colonnes || "*");
  else if (op === "insert") r = r.insert(q.valeurs, q.options || undefined);
  else if (op === "upsert") r = r.upsert(q.valeurs, q.options || undefined);
  else if (op === "update") r = r.update(q.valeurs);
  else if (op === "delete") r = r.delete();
  if (op !== "select" && q.retour) r = r.select(q.retour);

  for (const [f, c, v] of filtresFinal) r = r[f](c, v);
  for (const [c, asc] of ordre) r = r.order(c, { ascending: asc !== false });
  if (q.limite) r = r.limit(Math.min(Number(q.limite) || 1000, 5000));
  if (q.unique === "single") r = r.single();
  if (q.unique === "maybe") r = r.maybeSingle();

  const { data, error } = await r;
  return res.status(200).json({
    data: data ?? null,
    error: error ? { message: error.message, code: error.code, details: error.details } : null,
  });
};
