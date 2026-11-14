// Section « Workshop Thomas Guérineau » de la page Cirque en Fusion 2026 — inscription en ligne, 30 places
import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';

export const WORKSHOP_PLACES = 30;
const DISCIPLINES = ['Danse', 'Théâtre', 'Cirque', 'Musique', 'Autre'];
const VIDE = { prenom: '', nom: '', telephone: '', email: '', structure: '', message: '', site: '' };

export default function Workshop() {
  const [restantes, setRestantes] = useState(null);
  const [f, setF] = useState(VIDE);
  const [discipline, setDiscipline] = useState('');
  const [engage, setEngage] = useState(false);
  const [etat, setEtat] = useState({ envoi: false, ok: false, erreur: '' });
  const maj = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    let actif = true;
    supabase.rpc('workshop_places_restantes', { p_festival: 'cef-2026' }).then(({ data, error }) => {
      if (actif && !error && typeof data === 'number') setRestantes(data);
    });
    return () => { actif = false; };
  }, []);

  async function envoyer(e) {
    e.preventDefault();
    if (etat.envoi) return;
    setEtat({ envoi: true, ok: false, erreur: '' });
    const { data, error } = await supabase.rpc('inscrire_workshop', {
      p_prenom: f.prenom, p_nom: f.nom, p_telephone: f.telephone, p_email: f.email,
      p_discipline: discipline, p_structure: f.structure, p_message: f.message, p_site: f.site,
    });
    if (error) { setEtat({ envoi: false, ok: false, erreur: 'Inscription impossible pour le moment. Réessayez ou écrivez à circobenin@gmail.com.' }); return; }
    if (data?.error) {
      if (data.complet) setRestantes(0);
      setEtat({ envoi: false, ok: false, erreur: data.error });
      return;
    }
    if (typeof data?.places_restantes === 'number') setRestantes(data.places_restantes);
    setEtat({ envoi: false, ok: true, erreur: '' });
  }

  const complet = restantes === 0;

  return (
    <section id="workshop" className="cef-section">
      <div className="cef-wrap">
        <p className="cef-eyebrow">Workshop · Thomas Guérineau</p>
        <h2 className="cef-h2">Rythmes, corporalités et jonglerie musicale</h2>
        <p className="cef-lead">Un workshop pour les interprètes en danse, théâtre et cirque, mené par Thomas Guérineau, jongleur et metteur en scène de « Basketteuses de Bamako ». Il explore le rythme et le corps, et la jonglerie musicale : comment l'objet, le geste et le son font musique ensemble.</p>

        <div className="cef-ws-infos">
          <div className="cef-carte cef-bt-pink"><h4>Quand</h4><p>Lundi 23 et mardi 24 novembre 2026, 2 heures par jour. Les deux séances se suivent.</p></div>
          <div className="cef-carte cef-bt-plum"><h4>Où</h4><p>Site de Circo Bénin, Fidjrossè, Cotonou.</p></div>
          <div className="cef-carte cef-bt-blue"><h4>Pour qui</h4><p>Interprètes en danse, théâtre et cirque, débutants comme confirmés. Gratuit, sur inscription.</p></div>
          <div className="cef-carte cef-bt-yellow"><h4>Places</h4>
            <p><strong className="cef-ws-compteur">{restantes === null ? WORKSHOP_PLACES : restantes}</strong> {restantes === null ? 'places au total' : complet ? 'place restante : complet' : `place${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''} sur ${WORKSHOP_PLACES}`}</p>
          </div>
        </div>

        {etat.ok ? (
          <div className="cef-carte cef-bl-blue cef-acc-merci">
            <h4>Merci {f.prenom}, vous êtes inscrit·e !</h4>
            <p>Votre place au workshop est réservée. L'équipe vous confirme les horaires par WhatsApp ou par e-mail avant le 23 novembre.</p>
            <a className="cef-btn cef-btn-dark" href="#programme">Voir le programme du festival</a>
          </div>
        ) : complet ? (
          <div className="cef-carte cef-bl-blue cef-acc-merci">
            <h4>Le workshop est complet</h4>
            <p>Les 30 places sont prises. Écrivez à circobenin@gmail.com pour être sur la liste d'attente.</p>
          </div>
        ) : (
          <form className="cef-acc" onSubmit={envoyer}>
            <div className="cef-acc-champs">
              <div className="cef-acc-grille">
                <label>Prénom *<input required value={f.prenom} onChange={maj('prenom')} autoComplete="given-name" /></label>
                <label>Nom *<input required value={f.nom} onChange={maj('nom')} autoComplete="family-name" /></label>
                <label>Téléphone / WhatsApp *<input required type="tel" inputMode="tel" value={f.telephone} onChange={maj('telephone')} autoComplete="tel" /></label>
                <label>E-mail<input type="email" value={f.email} onChange={maj('email')} autoComplete="email" /></label>
                <label>Compagnie / structure<input value={f.structure} onChange={maj('structure')} /></label>
              </div>
              <p className="cef-acc-q">Votre discipline *</p>
              <div className="cef-acc-puces">
                {DISCIPLINES.map((d) => (
                  <button key={d} type="button" className={discipline === d ? 'is-active' : ''} onClick={() => setDiscipline(d)}>{d}</button>
                ))}
              </div>
              <label className="cef-acc-plein">Votre parcours en quelques mots
                <textarea rows={3} value={f.message} onChange={maj('message')} />
              </label>
              <label className="cef-ws-engage">
                <input type="checkbox" checked={engage} onChange={(e) => setEngage(e.target.checked)} />
                <span>Je m'engage à suivre les deux séances, le 23 et le 24 novembre.</span>
              </label>
              <input className="cef-acc-piege" tabIndex={-1} autoComplete="off" value={f.site} onChange={maj('site')} aria-hidden="true" />
              {etat.erreur && <p className="cef-erreur" role="alert">{etat.erreur}</p>}
              <button type="submit" className="cef-btn cef-btn-primary" disabled={etat.envoi || !discipline || !engage}>
                {etat.envoi ? 'Inscription…' : 'Je m’inscris'}
              </button>
              <p className="cef-mention">Inscription gratuite, dans la limite de 30 places. Premier inscrit, premier servi.</p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
