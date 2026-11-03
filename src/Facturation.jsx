// Facturation Circo Bénin : devis → facture pro forma → facture → encaissement
// Chaque document garde le lien vers celui d'où il vient. Un encaissement crée
// automatiquement l'écriture dans le journal de Trésorerie (operations_caisse).
import { useState, useEffect } from "react";
import { supabaseSecurise as db } from "./dbSecurise";

const VERT = "#2d7a4f";
const TYPES = {
  devis: { label: "Devis", prefixe: "DEV", couleur: "#1565C0" },
  proforma: { label: "Facture pro forma", prefixe: "PRO", couleur: "#7c3aed" },
  facture: { label: "Facture", prefixe: "FAC", couleur: VERT },
};
const STATUTS = {
  brouillon: "Brouillon", envoye: "Envoyé", accepte: "Accepté", refuse: "Refusé",
  transforme: "Transformé", a_payer: "À payer", partiel: "Payée en partie", payee: "Payée", annulee: "Annulée",
};
const COULEUR_STATUT = {
  brouillon: "#6b7280", envoye: "#1565C0", accepte: VERT, refuse: "#E63946", transforme: "#7c3aed",
  a_payer: "#E65100", partiel: "#E65100", payee: VERT, annulee: "#9ca3af",
};
const COMPTES_PRODUITS = [
  { code: "707", libelle: "707 — Prestations (billets, spectacles, ateliers)" },
  { code: "708", libelle: "708 — Produits annexes (stands, encarts publicitaires)" },
  { code: "754", libelle: "754 — Subventions / partenariats" },
  { code: "7061", libelle: "7061 — Stages et ateliers vacances" },
  { code: "706", libelle: "706 — Cotisations et inscriptions" },
  { code: "758", libelle: "758 — Produits divers" },
];
const PROJETS = ["Festival Cirque en Fusion", "Circo Bénin — fonctionnement", "Diffusion & événementiel", "Autre projet"];
const MODES = [
  { id: "especes", label: "Espèces", compte: "571" },
  { id: "mobile", label: "Mobile Money", compte: "521" },
  { id: "virement", label: "Virement / chèque", compte: "521" },
];
const MODELES = [
  { designation: "Billet spectacle — Cirque en Fusion 2026", prix: 3000 },
  { designation: "Billet Gala — Cirque en Fusion 2026", prix: 3000 },
  { designation: "Billet Gala VIP — Cirque en Fusion 2026", prix: 15000 },
  { designation: "Billet « Les Basketteuses de Bamako » (IFB)", prix: 5000 },
  { designation: "Stand au village du festival — grand format", prix: 150000, compte: "708" },
  { designation: "Stand au village du festival — petit format", prix: 100000, compte: "708" },
  { designation: "Encart publicitaire — supports du festival", prix: 0, compte: "708" },
  { designation: "Partenariat — Cirque en Fusion 2026", prix: 0, compte: "754" },
  { designation: "Atelier / prestation artistique", prix: 0 },
];
const PARAMS_DEFAUT = {
  id: 1, raison_sociale: "Association Circo Bénin", sous_titre: "École des arts du cirque",
  adresse: "Fidjrossè, Cotonou — Bénin", telephone: "+229 01 52 76 33 33", email: "accueil@circobenin.com",
  ifu: "", rccm: "", mention_tva: "Association non assujettie à la TVA",
  coordonnees_paiement: "", conditions: "Paiement à réception de la facture.", signataire: "",
};

const fcfa = (n) => (Math.round(Number(n) || 0)).toLocaleString("fr-FR").replace(/ /g, " ") + " FCFA";
const aujourdhui = () => new Date().toISOString().slice(0, 10);
const dateFr = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("fr-FR") : "");
const totalLignes = (lignes) => (lignes || []).reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.prix) || 0), 0);
const echapper = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Montant en lettres (français, pour les factures)
function enLettres(nombre) {
  const n = Math.round(Number(nombre) || 0);
  if (n === 0) return "zéro";
  const unites = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
  const dizaines = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante"];
  const moinsDeCent = (x) => {
    if (x < 17) return unites[x];
    if (x < 20) return "dix-" + unites[x - 10];
    if (x < 70) {
      const d = Math.floor(x / 10), u = x % 10;
      return dizaines[d] + (u === 1 ? " et un" : u ? "-" + unites[u] : "");
    }
    if (x < 80) return "soixante" + (x === 71 ? " et onze" : "-" + moinsDeCent(x - 60));
    const reste = x - 80;
    return "quatre-vingt" + (reste === 0 ? "s" : "-" + moinsDeCent(reste));
  };
  const moinsDeMille = (x) => {
    const c = Math.floor(x / 100), r = x % 100;
    let txt = "";
    if (c === 1) txt = "cent";
    else if (c > 1) txt = unites[c] + " cent" + (r === 0 ? "s" : "");
    if (r) txt += (txt ? " " : "") + moinsDeCent(r);
    return txt;
  };
  const parties = [];
  const milliards = Math.floor(n / 1e9), millions = Math.floor((n % 1e9) / 1e6), milliers = Math.floor((n % 1e6) / 1000), reste = n % 1000;
  if (milliards) parties.push(moinsDeMille(milliards) + " milliard" + (milliards > 1 ? "s" : ""));
  if (millions) parties.push(moinsDeMille(millions) + " million" + (millions > 1 ? "s" : ""));
  if (milliers) parties.push(milliers === 1 ? "mille" : moinsDeMille(milliers).replace(/s$/, "") + " mille");
  if (reste) parties.push(moinsDeMille(reste));
  return parties.join(" ");
}

function prochainNumero(documents, type, date) {
  const annee = (date || aujourdhui()).slice(0, 4);
  const prefixe = TYPES[type].prefixe + "-" + annee + "-";
  const max = documents
    .filter((d) => d.numero && d.numero.startsWith(prefixe))
    .reduce((m, d) => Math.max(m, parseInt(d.numero.slice(prefixe.length), 10) || 0), 0);
  return prefixe + String(max + 1).padStart(3, "0");
}

function imprimer(doc, params, logo) {
  const t = TYPES[doc.type];
  const total = totalLignes(doc.lignes);
  const lignes = (doc.lignes || []).map((l) => `
    <tr><td>${echapper(l.designation)}</td><td class="n">${echapper(l.quantite)}</td>
    <td class="n">${fcfa(l.prix)}</td><td class="n">${fcfa((Number(l.quantite) || 0) * (Number(l.prix) || 0))}</td></tr>`).join("");
  const c = doc.client || {};
  const reste = total - (Number(doc.montant_paye) || 0);
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${t.label} ${echapper(doc.numero)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 12px; margin: 0; }
  .entete { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${VERT}; padding-bottom: 12px; }
  .emetteur { display: flex; gap: 12px; align-items: center; }
  .emetteur img { width: 70px; height: 70px; object-fit: contain; }
  .emetteur h1 { font-size: 16px; margin: 0; color: ${VERT}; }
  .emetteur p { margin: 2px 0; color: #4b5563; }
  .titre { text-align: right; }
  .titre h2 { font-size: 22px; margin: 0; color: ${t.couleur}; text-transform: uppercase; letter-spacing: 1px; }
  .titre p { margin: 3px 0; }
  .blocs { display: flex; justify-content: space-between; gap: 20px; margin: 18px 0; }
  .bloc { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; }
  .bloc b.t { display: block; font-size: 10px; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: ${VERT}; color: #fff; text-align: left; padding: 8px; font-size: 11px; }
  td { padding: 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  .n { text-align: right; white-space: nowrap; }
  .totaux { margin-left: auto; width: 300px; margin-top: 12px; }
  .totaux div { display: flex; justify-content: space-between; padding: 5px 8px; }
  .totaux .g { background: ${VERT}; color: #fff; font-weight: bold; font-size: 14px; border-radius: 4px; }
  .lettres { margin-top: 10px; font-style: italic; }
  .mentions { margin-top: 18px; font-size: 11px; color: #374151; }
  .signature { margin-top: 30px; display: flex; justify-content: flex-end; }
  .signature div { width: 220px; text-align: center; border-top: 1px solid #9ca3af; padding-top: 6px; }
  .pied { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 4px; }
  .annule { color: #E63946; font-weight: bold; font-size: 16px; border: 2px solid #E63946; display: inline-block; padding: 4px 10px; margin-top: 6px; }
</style></head><body>
  <div class="entete">
    <div class="emetteur">${logo ? `<img src="${logo}" alt="">` : ""}<div>
      <h1>${echapper(params.raison_sociale)}</h1><p>${echapper(params.sous_titre)}</p>
      <p>${echapper(params.adresse)}</p><p>${echapper(params.telephone)} · ${echapper(params.email)}</p>
      ${params.ifu ? `<p>IFU : ${echapper(params.ifu)}</p>` : ""}${params.rccm ? `<p>${echapper(params.rccm)}</p>` : ""}
    </div></div>
    <div class="titre"><h2>${t.label}</h2><p><b>N° ${echapper(doc.numero)}</b></p><p>Date : ${dateFr(doc.date)}</p>
      ${doc.type === "devis" && doc.echeance ? `<p>Valable jusqu'au : ${dateFr(doc.echeance)}</p>` : ""}
      ${doc.type !== "devis" && doc.echeance ? `<p>Échéance : ${dateFr(doc.echeance)}</p>` : ""}
      ${doc.origine_numero ? `<p>Réf. : ${echapper(doc.origine_numero)}</p>` : ""}
      ${doc.statut === "annulee" ? `<div class="annule">ANNULÉE</div>` : ""}</div>
  </div>
  <div class="blocs">
    <div class="bloc"><b class="t">Client</b><b>${echapper(c.nom)}</b>
      ${c.contact ? `<br>À l'attention de : ${echapper(c.contact)}` : ""}${c.adresse ? `<br>${echapper(c.adresse)}` : ""}
      ${c.ifu ? `<br>IFU : ${echapper(c.ifu)}` : ""}${c.telephone ? `<br>Tél. : ${echapper(c.telephone)}` : ""}${c.email ? `<br>${echapper(c.email)}` : ""}</div>
    <div class="bloc"><b class="t">Objet</b>${echapper(doc.objet) || "—"}</div>
  </div>
  <table><thead><tr><th>Désignation</th><th class="n">Qté</th><th class="n">Prix unitaire</th><th class="n">Montant</th></tr></thead><tbody>${lignes}</tbody></table>
  <div class="totaux"><div class="g"><span>Total ${params.mention_tva ? "net" : "TTC"}</span><span>${fcfa(total)}</span></div>
    ${doc.type === "facture" && Number(doc.montant_paye) > 0 ? `<div><span>Déjà réglé</span><span>${fcfa(doc.montant_paye)}</span></div><div><b>Reste à payer</b><b>${fcfa(reste)}</b></div>` : ""}</div>
  <p class="lettres">Arrêté${doc.type === "devis" ? " le présent devis" : doc.type === "proforma" ? "e la présente facture pro forma" : "e la présente facture"} à la somme de : <b>${enLettres(total)} francs CFA</b>.</p>
  <div class="mentions">${params.mention_tva ? `<p><b>${echapper(params.mention_tva)}</b></p>` : ""}
    ${doc.type === "proforma" ? "<p>Facture pro forma : document sans valeur comptable, établi pour engagement de commande.</p>" : ""}
    ${params.conditions ? `<p>${echapper(params.conditions)}</p>` : ""}
    ${params.coordonnees_paiement ? `<p><b>Règlement :</b> ${echapper(params.coordonnees_paiement)}</p>` : ""}
    ${doc.notes ? `<p>${echapper(doc.notes)}</p>` : ""}</div>
  <div class="signature"><div>${echapper(params.signataire) || "Pour Circo Bénin"}<br><br><br>Signature et cachet</div></div>
  <div class="pied">${echapper(params.raison_sociale)} · ${echapper(params.adresse)} · ${echapper(params.email)}</div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) { alert("Autorisez l'ouverture des fenêtres pour imprimer ou enregistrer en PDF."); return; }
  w.document.open(); w.document.write(html); w.document.close();
}

const champ = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, background: "#f9fafb", boxSizing: "border-box", fontFamily: "inherit" };
const etiquette = { fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 };
const carte = { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 };
const bouton = (couleur = VERT, discret = false) => ({
  background: discret ? "#fff" : couleur, color: discret ? couleur : "#fff", border: `1.5px solid ${couleur}`,
  borderRadius: 10, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
});

const DOC_VIDE = () => ({
  type: "devis", date: aujourdhui(), echeance: "", objet: "", projet: PROJETS[0], compte_produit: "707",
  client: { nom: "", contact: "", adresse: "", ifu: "", telephone: "", email: "" },
  lignes: [{ designation: "", quantite: 1, prix: 0 }], notes: "",
});

export default function Facturation({ role, utilisateur, logo }) {
  const [documents, setDocuments] = useState([]);
  const [params, setParams] = useState(PARAMS_DEFAUT);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [vue, setVue] = useState("liste"); // liste | edition | parametres
  const [filtre, setFiltre] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [brouillon, setBrouillon] = useState(DOC_VIDE());
  const [paiement, setPaiement] = useState(null); // { doc, montant, date, mode }
  const [occupe, setOccupe] = useState(false);
  const [rafraichir, setRafraichir] = useState(0);
  const peutSupprimer = role === "directeur" || role === "admin";
  const auteur = utilisateur || role;

  useEffect(() => {
    let actif = true;
    (async () => {
      setChargement(true);
      const [d, p] = await Promise.all([
        db.from("documents_commerciaux").select("*").order("created_at", { ascending: false }),
        db.from("facturation_parametres").select("*").eq("id", 1).maybeSingle(),
      ]);
      if (!actif) return;
      if (d.error) setErreur("Impossible de charger les documents : " + d.error.message + ". La table documents_commerciaux existe-t-elle dans Supabase ?");
      else { setErreur(""); setDocuments(d.data || []); }
      if (p.data) setParams({ ...PARAMS_DEFAUT, ...p.data });
      setChargement(false);
    })();
    return () => { actif = false; };
  }, [rafraichir]);

  const recharger = () => setRafraichir((x) => x + 1);

  const nouveau = (type = "devis") => { setBrouillon({ ...DOC_VIDE(), type }); setVue("edition"); };
  const modifier = (doc) => { setBrouillon(JSON.parse(JSON.stringify(doc))); setVue("edition"); };
  const majClient = (k, v) => setBrouillon((b) => ({ ...b, client: { ...b.client, [k]: v } }));
  const majLigne = (i, k, v) => setBrouillon((b) => ({ ...b, lignes: b.lignes.map((l, j) => (j === i ? { ...l, [k]: v } : l)) }));
  const ajouterLigne = (modele) => setBrouillon((b) => ({ ...b, compte_produit: modele && modele.compte ? modele.compte : b.compte_produit, lignes: [...b.lignes.filter((l) => l.designation || l.prix), { designation: modele ? modele.designation : "", quantite: 1, prix: modele ? modele.prix : 0 }] }));
  const retirerLigne = (i) => setBrouillon((b) => ({ ...b, lignes: b.lignes.filter((_, j) => j !== i) }));

  const enregistrer = async () => {
    const b = brouillon;
    const lignes = b.lignes.filter((l) => String(l.designation).trim());
    if (!b.client.nom.trim()) { alert("Indiquez le nom du client (entreprise)."); return; }
    if (!lignes.length) { alert("Ajoutez au moins une ligne."); return; }
    if (totalLignes(lignes) <= 0) { alert("Le total doit être supérieur à 0."); return; }
    if (b.type === "facture" && !b.id && !window.confirm("Une facture émise ne pourra plus être modifiée (seulement annulée). Émettre la facture ?")) return;
    setOccupe(true);
    const valeurs = {
      type: b.type, date: b.date, echeance: b.echeance || null, objet: b.objet, projet: b.projet,
      compte_produit: b.compte_produit, client: b.client, notes: b.notes,
      lignes: lignes.map((l) => ({ designation: l.designation, quantite: Number(l.quantite) || 0, prix: Number(l.prix) || 0 })),
      total: totalLignes(lignes),
    };
    let rep;
    if (b.id) rep = await db.from("documents_commerciaux").update(valeurs).eq("id", b.id);
    else rep = await db.from("documents_commerciaux").insert([{
      ...valeurs, numero: prochainNumero(documents, b.type, b.date),
      statut: b.type === "facture" ? "a_payer" : "brouillon", montant_paye: 0,
      origine_id: b.origine_id || null, origine_numero: b.origine_numero || null, cree_par: auteur,
    }]);
    setOccupe(false);
    if (rep.error) { alert("Erreur : " + rep.error.message); return; }
    setVue("liste"); recharger();
  };

  const changerStatut = async (doc, statut) => {
    const { error } = await db.from("documents_commerciaux").update({ statut }).eq("id", doc.id);
    if (error) alert("Erreur : " + error.message); else recharger();
  };

  const transformer = async (doc, versType) => {
    const libelle = TYPES[versType].label.toLowerCase();
    if (!window.confirm(`Créer une ${libelle} à partir de ${doc.numero} ?` + (versType === "facture" ? "\nUne facture émise ne pourra plus être modifiée." : ""))) return;
    setOccupe(true);
    const date = aujourdhui();
    const { error } = await db.from("documents_commerciaux").insert([{
      type: versType, numero: prochainNumero(documents, versType, date), date, echeance: null,
      objet: doc.objet, projet: doc.projet, compte_produit: doc.compte_produit, client: doc.client,
      lignes: doc.lignes, total: doc.total, notes: doc.notes,
      statut: versType === "facture" ? "a_payer" : "brouillon", montant_paye: 0,
      origine_id: doc.id, origine_numero: doc.numero, cree_par: auteur,
    }]);
    if (!error) await db.from("documents_commerciaux").update({ statut: "transforme" }).eq("id", doc.id);
    setOccupe(false);
    if (error) alert("Erreur : " + error.message); else recharger();
  };

  const supprimer = async (doc) => {
    if (!window.confirm(`Supprimer définitivement ${doc.numero} ?`)) return;
    const { error } = await db.from("documents_commerciaux").delete().eq("id", doc.id);
    if (error) alert("Erreur : " + error.message); else recharger();
  };

  const annuler = async (doc) => {
    const motif = window.prompt(`Annuler la facture ${doc.numero} ? Indiquez le motif :`);
    if (!motif) return;
    const notes = (doc.notes ? doc.notes + "\n" : "") + "Annulée le " + dateFr(aujourdhui()) + " : " + motif;
    const { error } = await db.from("documents_commerciaux").update({ statut: "annulee", notes }).eq("id", doc.id);
    if (error) alert("Erreur : " + error.message); else recharger();
  };

  const encaisser = async () => {
    const p = paiement;
    const doc = p.doc;
    const montant = Math.round(Number(p.montant) || 0);
    const reste = (Number(doc.total) || 0) - (Number(doc.montant_paye) || 0);
    if (montant <= 0) { alert("Montant invalide."); return; }
    if (montant > reste && !window.confirm(`Le montant dépasse le reste à payer (${fcfa(reste)}). Continuer ?`)) return;
    const mode = MODES.find((m) => m.id === p.mode) || MODES[0];
    setOccupe(true);
    const op = await db.from("operations_caisse").insert([{
      date: p.date, projet: doc.projet, sens: "entree",
      compte_caisse: mode.compte, compte_contrepartie: doc.compte_produit,
      compte_debit: mode.compte, compte_credit: doc.compte_produit,
      montant, libelle: `Facture ${doc.numero} — ${doc.client && doc.client.nom} (${mode.label})`,
      saisi_par: auteur,
    }]);
    if (op.error) { setOccupe(false); alert("Erreur trésorerie : " + op.error.message); return; }
    const paye = (Number(doc.montant_paye) || 0) + montant;
    const statut = paye >= (Number(doc.total) || 0) ? "payee" : "partiel";
    const historique = [...(doc.paiements || []), { date: p.date, montant, mode: mode.label, par: auteur }];
    const { error } = await db.from("documents_commerciaux").update({ montant_paye: paye, statut, paiements: historique }).eq("id", doc.id);
    setOccupe(false);
    if (error) alert("Paiement enregistré en trésorerie, mais la facture n'a pas été mise à jour : " + error.message);
    setPaiement(null); recharger();
  };

  const enregistrerParams = async () => {
    setOccupe(true);
    const { error } = await db.from("facturation_parametres").upsert([{ ...params, id: 1 }]);
    setOccupe(false);
    if (error) alert("Erreur : " + error.message); else { alert("Informations enregistrées."); setVue("liste"); }
  };

  const visibles = documents.filter((d) => (filtre === "tous" || d.type === filtre || (filtre === "impayees" && d.type === "facture" && ["a_payer", "partiel"].includes(d.statut))))
    .filter((d) => !recherche || (d.numero + " " + (d.client && d.client.nom) + " " + d.objet).toLowerCase().includes(recherche.toLowerCase()));
  const factures = documents.filter((d) => d.type === "facture" && d.statut !== "annulee");
  const totalFacture = factures.reduce((s, d) => s + (Number(d.total) || 0), 0);
  const totalEncaisse = factures.reduce((s, d) => s + (Number(d.montant_paye) || 0), 0);

  // ── Écran : informations de l'association ──
  if (vue === "parametres") {
    const P = (k, label, ph) => (
      <div style={{ marginBottom: 12 }}><label style={etiquette}>{label}</label>
        <input style={champ} value={params[k] || ""} placeholder={ph} onChange={(e) => setParams({ ...params, [k]: e.target.value })} /></div>);
    return (
      <div style={{ maxWidth: 640 }}>
        <div style={carte}>
          <h3 style={{ marginTop: 0, color: VERT }}>Informations figurant sur les documents</h3>
          {P("raison_sociale", "Raison sociale")}{P("sous_titre", "Sous-titre")}{P("adresse", "Adresse")}
          {P("telephone", "Téléphone")}{P("email", "E-mail")}
          {P("ifu", "N° IFU de l'association", "13 chiffres")}{P("rccm", "N° d'enregistrement / récépissé", "ex. Récépissé n° …")}
          {P("mention_tva", "Mention TVA", "Association non assujettie à la TVA")}
          {P("conditions", "Conditions de paiement")}
          {P("coordonnees_paiement", "Coordonnées de paiement", "Banque, IBAN / n° Mobile Money…")}
          {P("signataire", "Signataire", "Nom et fonction")}
          <div style={{ display: "flex", gap: 8 }}>
            <button style={bouton()} disabled={occupe} onClick={enregistrerParams}>Enregistrer</button>
            <button style={bouton(VERT, true)} onClick={() => setVue("liste")}>Retour</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Écran : création / modification ──
  if (vue === "edition") {
    const b = brouillon;
    const verrou = b.id && b.type === "facture";
    return (
      <div style={{ maxWidth: 860 }}>
        <div style={carte}>
          <h3 style={{ marginTop: 0, color: TYPES[b.type].couleur }}>{b.id ? `Modifier ${b.numero}` : `Nouveau document`}</h3>
          {verrou && <p style={{ color: "#E63946" }}>Une facture émise ne peut plus être modifiée. Annulez-la et créez-en une nouvelle si besoin.</p>}
          {!b.id && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {Object.entries(TYPES).map(([k, t]) => (
                <button key={k} style={bouton(t.couleur, b.type !== k)} onClick={() => setBrouillon({ ...b, type: k })}>{t.label}</button>
              ))}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
            <div><label style={etiquette}>Date</label><input type="date" style={champ} value={b.date} onChange={(e) => setBrouillon({ ...b, date: e.target.value })} /></div>
            <div><label style={etiquette}>{b.type === "devis" ? "Valable jusqu'au" : "Échéance de paiement"}</label><input type="date" style={champ} value={b.echeance || ""} onChange={(e) => setBrouillon({ ...b, echeance: e.target.value })} /></div>
            <div><label style={etiquette}>Projet (trésorerie)</label><select style={champ} value={b.projet} onChange={(e) => setBrouillon({ ...b, projet: e.target.value })}>{PROJETS.map((p) => <option key={p}>{p}</option>)}</select></div>
            <div><label style={etiquette}>Compte de produit</label><select style={champ} value={b.compte_produit} onChange={(e) => setBrouillon({ ...b, compte_produit: e.target.value })}>{COMPTES_PRODUITS.map((c) => <option key={c.code} value={c.code}>{c.libelle}</option>)}</select></div>
          </div>
          <h4 style={{ marginBottom: 8 }}>Client</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
            {[["nom", "Entreprise / organisme *"], ["contact", "À l'attention de"], ["adresse", "Adresse"], ["ifu", "IFU du client"], ["telephone", "Téléphone"], ["email", "E-mail"]].map(([k, l]) => (
              <div key={k}><label style={etiquette}>{l}</label><input style={champ} value={b.client[k] || ""} onChange={(e) => majClient(k, e.target.value)} /></div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}><label style={etiquette}>Objet</label><input style={champ} value={b.objet} placeholder="ex. Réservation de places — Cirque en Fusion 2026" onChange={(e) => setBrouillon({ ...b, objet: e.target.value })} /></div>
          <h4 style={{ marginBottom: 8 }}>Lignes</h4>
          {b.lignes.map((l, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 120px 110px 32px", gap: 6, marginBottom: 6, alignItems: "center" }}>
              <input style={champ} placeholder="Désignation" value={l.designation} onChange={(e) => majLigne(i, "designation", e.target.value)} />
              <input style={champ} type="number" min="0" value={l.quantite} onChange={(e) => majLigne(i, "quantite", e.target.value)} />
              <input style={champ} type="number" min="0" value={l.prix} onChange={(e) => majLigne(i, "prix", e.target.value)} />
              <div style={{ textAlign: "right", fontWeight: 700, fontSize: 13 }}>{fcfa((Number(l.quantite) || 0) * (Number(l.prix) || 0))}</div>
              <button style={{ ...bouton("#E63946", true), padding: "6px 0" }} onClick={() => retirerLigne(i)} title="Retirer">✕</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
            <button style={bouton(VERT, true)} onClick={() => ajouterLigne()}>+ Ligne libre</button>
            <select style={{ ...champ, width: "auto" }} value="" onChange={(e) => { const m = MODELES[Number(e.target.value)]; if (m) ajouterLigne(m); }}>
              <option value="">+ Ajouter un article courant…</option>
              {MODELES.map((m, i) => <option key={i} value={i}>{m.designation}{m.prix ? " — " + fcfa(m.prix) : ""}</option>)}
            </select>
          </div>
          <div style={{ textAlign: "right", fontSize: 18, fontWeight: 800, color: VERT }}>Total : {fcfa(totalLignes(b.lignes))}</div>
          <div style={{ fontSize: 12, color: "#6b7280", textAlign: "right" }}>{enLettres(totalLignes(b.lignes))} francs CFA</div>
          <div style={{ marginTop: 12 }}><label style={etiquette}>Notes (apparaissent sur le document)</label><textarea style={{ ...champ, minHeight: 60 }} value={b.notes || ""} onChange={(e) => setBrouillon({ ...b, notes: e.target.value })} /></div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {!verrou && <button style={bouton(TYPES[b.type].couleur)} disabled={occupe} onClick={enregistrer}>{b.id ? "Enregistrer" : b.type === "facture" ? "Émettre la facture" : "Créer"}</button>}
            <button style={bouton(VERT, true)} onClick={() => setVue("liste")}>Annuler</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Écran : liste ──
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, color: VERT }}>Facturation</h2>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Devis → facture pro forma → facture → encaissement en trésorerie</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={bouton(TYPES.devis.couleur)} onClick={() => nouveau("devis")}>+ Devis</button>
          <button style={bouton(TYPES.proforma.couleur)} onClick={() => nouveau("proforma")}>+ Pro forma</button>
          <button style={bouton(VERT)} onClick={() => nouveau("facture")}>+ Facture</button>
          <button style={bouton("#6b7280", true)} onClick={() => setVue("parametres")}>⚙ Infos association</button>
        </div>
      </div>

      {!params.ifu && <div style={{ ...carte, background: "#FFF7ED", color: "#9a3412" }}>Complétez les informations de l'association (IFU, coordonnées de paiement, signataire) dans « ⚙ Infos association » : elles apparaissent sur chaque document.</div>}
      {erreur && <div style={{ ...carte, background: "#FEF2F2", color: "#991b1b" }}>{erreur}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 16 }}>
        {[["Facturé", totalFacture, VERT], ["Encaissé", totalEncaisse, "#1565C0"], ["Reste à encaisser", totalFacture - totalEncaisse, "#E65100"]].map(([l, v, c]) => (
          <div key={l} style={{ ...carte, marginBottom: 0, borderTop: `4px solid ${c}` }}><div style={{ fontSize: 22, fontWeight: 800, color: c }}>{fcfa(v)}</div><div style={{ fontSize: 13, color: "#6b7280" }}>{l}</div></div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {[["tous", "Tous"], ["devis", "Devis"], ["proforma", "Pro forma"], ["facture", "Factures"], ["impayees", "Impayées"]].map(([k, l]) => (
          <button key={k} style={bouton(VERT, filtre !== k)} onClick={() => setFiltre(k)}>{l}</button>
        ))}
        <input style={{ ...champ, width: 220 }} placeholder="Rechercher (n°, client…)" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
      </div>

      {chargement ? <p>Chargement…</p> : visibles.length === 0 ? <div style={carte}>Aucun document pour l'instant.</div> : visibles.map((d) => {
        const t = TYPES[d.type] || TYPES.devis;
        const reste = (Number(d.total) || 0) - (Number(d.montant_paye) || 0);
        return (
          <div key={d.id} style={{ ...carte, borderLeft: `5px solid ${t.couleur}`, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 800 }}>{t.label} {d.numero} <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: COULEUR_STATUT[d.statut] || "#6b7280", borderRadius: 20, padding: "2px 8px", marginLeft: 6 }}>{STATUTS[d.statut] || d.statut}</span></div>
                <div style={{ fontSize: 14 }}>{d.client && d.client.nom}{d.objet ? " — " + d.objet : ""}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{dateFr(d.date)}{d.origine_numero ? " · issu de " + d.origine_numero : ""}{d.cree_par ? " · par " + d.cree_par : ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{fcfa(d.total)}</div>
                {d.type === "facture" && d.statut !== "annulee" && <div style={{ fontSize: 12, color: reste > 0 ? "#E65100" : VERT }}>{reste > 0 ? "Reste " + fcfa(reste) : "Soldée"}</div>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              <button style={bouton(VERT, true)} onClick={() => imprimer(d, params, logo)}>🖨 Imprimer / PDF</button>
              {d.type !== "facture" && !["transforme", "refuse"].includes(d.statut) && <button style={bouton("#6b7280", true)} onClick={() => modifier(d)}>Modifier</button>}
              {d.type !== "facture" && d.statut === "brouillon" && <button style={bouton("#1565C0", true)} onClick={() => changerStatut(d, "envoye")}>Marquer envoyé</button>}
              {d.type === "devis" && ["brouillon", "envoye"].includes(d.statut) && <button style={bouton(VERT, true)} onClick={() => changerStatut(d, "accepte")}>Accepté</button>}
              {d.type === "devis" && ["brouillon", "envoye"].includes(d.statut) && <button style={bouton("#E63946", true)} onClick={() => changerStatut(d, "refuse")}>Refusé</button>}
              {d.type === "devis" && !["transforme", "refuse"].includes(d.statut) && <button style={bouton(TYPES.proforma.couleur)} disabled={occupe} onClick={() => transformer(d, "proforma")}>→ Pro forma</button>}
              {d.type !== "facture" && !["transforme", "refuse"].includes(d.statut) && <button style={bouton(VERT)} disabled={occupe} onClick={() => transformer(d, "facture")}>→ Facture</button>}
              {d.type === "facture" && ["a_payer", "partiel"].includes(d.statut) && <button style={bouton(VERT)} onClick={() => setPaiement({ doc: d, montant: reste, date: aujourdhui(), mode: "especes" })}>💰 Enregistrer un paiement</button>}
              {d.type === "facture" && d.statut !== "annulee" && Number(d.montant_paye) === 0 && peutSupprimer && <button style={bouton("#E63946", true)} onClick={() => annuler(d)}>Annuler la facture</button>}
              {d.type !== "facture" && peutSupprimer && d.statut !== "transforme" && <button style={bouton("#E63946", true)} onClick={() => supprimer(d)}>Supprimer</button>}
            </div>
            {d.paiements && d.paiements.length > 0 && (
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>Paiements : {d.paiements.map((p) => `${dateFr(p.date)} ${fcfa(p.montant)} (${p.mode})`).join(" · ")}</div>
            )}
          </div>
        );
      })}

      {paiement && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ ...carte, width: "100%", maxWidth: 420 }}>
            <h3 style={{ marginTop: 0, color: VERT }}>Paiement — {paiement.doc.numero}</h3>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0 }}>{paiement.doc.client && paiement.doc.client.nom} · reste {fcfa((Number(paiement.doc.total) || 0) - (Number(paiement.doc.montant_paye) || 0))}</p>
            <label style={etiquette}>Montant reçu (FCFA)</label>
            <input style={champ} type="number" value={paiement.montant} onChange={(e) => setPaiement({ ...paiement, montant: e.target.value })} />
            <label style={{ ...etiquette, marginTop: 10 }}>Date</label>
            <input style={champ} type="date" value={paiement.date} onChange={(e) => setPaiement({ ...paiement, date: e.target.value })} />
            <label style={{ ...etiquette, marginTop: 10 }}>Mode de paiement</label>
            <select style={champ} value={paiement.mode} onChange={(e) => setPaiement({ ...paiement, mode: e.target.value })}>{MODES.map((m) => <option key={m.id} value={m.id}>{m.label} (compte {m.compte})</option>)}</select>
            <p style={{ fontSize: 12, color: "#6b7280" }}>L'encaissement sera inscrit automatiquement dans la Trésorerie (projet « {paiement.doc.projet} », compte {paiement.doc.compte_produit}).</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={bouton()} disabled={occupe} onClick={encaisser}>Valider le paiement</button>
              <button style={bouton(VERT, true)} onClick={() => setPaiement(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
