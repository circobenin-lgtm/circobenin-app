import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';
import { BILLETS_SECOURS, formatFcfa } from './festivalData';

const MAX_PAR_SPECTACLE = 10;

export default function Billetterie() {
  const [evenements, setEvenements] = useState(BILLETS_SECOURS);
  const [chargement, setChargement] = useState(true);
  const [panier, setPanier] = useState({});
  const [acheteur, setAcheteur] = useState({ prenom: '', nom: '', telephone: '', email: '' });
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let actif = true;
    supabase
      .from('festival_event_availability')
      .select('slug, titre, compagnie, date_label, lieu, prix_fcfa, places_restantes')
      .eq('festival', 'cef-2026')
      .order('starts_at')
      .then(({ data, error }) => {
        if (!actif) return;
        if (!error && data?.length) setEvenements(data);
        setChargement(false);
      });
    return () => { actif = false; };
  }, []);

  const lignes = useMemo(
    () => evenements.filter((e) => panier[e.slug] > 0).map((e) => ({ ...e, quantite: panier[e.slug] })),
    [evenements, panier],
  );
  const total = lignes.reduce((s, l) => s + l.quantite * l.prix_fcfa, 0);
  const nbBillets = lignes.reduce((s, l) => s + l.quantite, 0);

  const changer = (slug, delta, max) =>
    setPanier((p) => {
      const q = Math.max(0, Math.min((p[slug] || 0) + delta, Math.min(max, MAX_PAR_SPECTACLE)));
      return { ...p, [slug]: q };
    });

  const telephoneValide = acheteur.telephone.replace(/\D/g, '').length >= 8;
  const formulaireOk = nbBillets > 0 && acheteur.prenom.trim() && acheteur.nom.trim() && telephoneValide;

  async function payer(e) {
    e.preventDefault();
    if (!formulaireOk || envoi) return;
    setEnvoi(true);
    setErreur('');
    const { data, error } = await supabase.functions.invoke('festival-checkout', {
      body: {
        festival: 'cef-2026',
        items: lignes.map((l) => ({ slug: l.slug, quantite: l.quantite })),
        acheteur: {
          prenom: acheteur.prenom.trim(),
          nom: acheteur.nom.trim(),
          telephone: acheteur.telephone.trim(),
          email: acheteur.email.trim() || null,
        },
      },
    });
    if (error || !data?.url) {
      setErreur(data?.message || "Le paiement n'a pas pu démarrer. Réessayez dans un instant ou contactez-nous.");
      setEnvoi(false);
      return;
    }
    window.location.assign(data.url); // page de paiement FedaPay (Mobile Money / carte)
  }

  return (
    <div className="cef-billetterie">
      <div className="cef-billets-liste" aria-busy={chargement}>
        {evenements.map((ev) => {
          const q = panier[ev.slug] || 0;
          const complet = ev.places_restantes <= 0;
          return (
            <article key={ev.slug} className={`cef-billet ${q ? 'is-selected' : ''} ${complet ? 'is-full' : ''}`}>
              <div className="cef-billet-info">
                <p className="cef-billet-date">{ev.date_label}</p>
                <h4>{ev.titre}</h4>
                <p className="cef-billet-meta">{[ev.compagnie, ev.lieu].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="cef-billet-achat">
                <p className="cef-billet-prix">{formatFcfa(ev.prix_fcfa)}</p>
                {complet ? (
                  <span className="cef-badge cef-badge-dark">Complet</span>
                ) : (
                  <div className="cef-stepper" role="group" aria-label={`Nombre de places pour ${ev.titre}`}>
                    <button type="button" onClick={() => changer(ev.slug, -1, ev.places_restantes)} disabled={!q} aria-label="Retirer une place">−</button>
                    <output aria-live="polite">{q}</output>
                    <button type="button" onClick={() => changer(ev.slug, 1, ev.places_restantes)} disabled={q >= Math.min(ev.places_restantes, MAX_PAR_SPECTACLE)} aria-label="Ajouter une place">+</button>
                  </div>
                )}
                {!complet && ev.places_restantes <= 30 && <p className="cef-billet-alerte">Plus que {ev.places_restantes} places</p>}
              </div>
            </article>
          );
        })}
      </div>

      <form className="cef-panier" onSubmit={payer}>
        <h4>Votre commande</h4>
        {lignes.length === 0 ? (
          <p className="cef-panier-vide">Choisissez vos spectacles avec les boutons + .</p>
        ) : (
          <ul className="cef-panier-lignes">
            {lignes.map((l) => (
              <li key={l.slug}>
                <span>{l.quantite} × {l.titre}</span>
                <span>{formatFcfa(l.quantite * l.prix_fcfa)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="cef-panier-total">
          <span>Total</span>
          <strong>{formatFcfa(total)}</strong>
        </div>

        <fieldset disabled={envoi}>
          <div className="cef-champs-2">
            <label>Prénom<input required value={acheteur.prenom} onChange={(e) => setAcheteur({ ...acheteur, prenom: e.target.value })} autoComplete="given-name" /></label>
            <label>Nom<input required value={acheteur.nom} onChange={(e) => setAcheteur({ ...acheteur, nom: e.target.value })} autoComplete="family-name" /></label>
          </div>
          <label>Téléphone (Mobile Money)
            <input required type="tel" inputMode="tel" placeholder="01 XX XX XX XX" value={acheteur.telephone} onChange={(e) => setAcheteur({ ...acheteur, telephone: e.target.value })} autoComplete="tel" />
          </label>
          <label>E-mail <span className="cef-optionnel">(facultatif, pour recevoir vos billets)</span>
            <input type="email" value={acheteur.email} onChange={(e) => setAcheteur({ ...acheteur, email: e.target.value })} autoComplete="email" />
          </label>
        </fieldset>

        {erreur && <p className="cef-erreur" role="alert">{erreur}</p>}

        <button type="submit" className="cef-btn cef-btn-primary cef-btn-block" disabled={!formulaireOk || envoi}>
          {envoi ? 'Redirection vers le paiement…' : nbBillets ? `Payer ${formatFcfa(total)}` : 'Payer'}
        </button>
        <p className="cef-panier-note">Paiement sécurisé par FedaPay : MTN MoMo, Moov Money, Celtiis Cash ou carte bancaire. Vos billets (avec QR code) s'affichent dès le paiement validé.</p>
      </form>
    </div>
  );
}
