// Section « Accréditations & influenceurs » de la page Cirque en Fusion 2026
import { useState } from 'react';

const TYPES = [
  { id: 'professionnel', titre: 'Professionnel', texte: 'Programmateur, compagnie, institution, partenaire' },
  { id: 'presse', titre: 'Presse / média', texte: 'Journaliste, radio, télévision, photographe' },
  { id: 'influenceur', titre: 'Influenceur', texte: 'Créateur de contenu sur TikTok, Instagram, Facebook, YouTube…' },
];
const JOURS = ['Mer. 25', 'Jeu. 26', 'Ven. 27', 'Sam. 28'];
const RESEAUX = ['TikTok', 'Instagram', 'Facebook', 'YouTube', 'X', 'Snapchat'];
const VIDE = { prenom: '', nom: '', structure: '', fonction: '', email: '', telephone: '', ville: '', lien: '', abonnes: '', message: '', site: '' };

export default function Accreditation() {
  const [type, setType] = useState('');
  const [f, setF] = useState(VIDE);
  const [jours, setJours] = useState([]);
  const [reseaux, setReseaux] = useState([]);
  const [etat, setEtat] = useState({ envoi: false, ok: false, erreur: '' });

  const maj = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const basculer = (liste, setListe, v) => setListe(liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v]);
  const influenceur = type === 'influenceur';

  async function envoyer(e) {
    e.preventDefault();
    if (etat.envoi) return;
    setEtat({ envoi: true, ok: false, erreur: '' });
    try {
      const rep = await fetch('/api/festival-accreditation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, type, jours: jours.join(', '), plateformes: reseaux.join(', ') }),
      });
      const d = await rep.json().catch(() => ({}));
      if (!rep.ok) { setEtat({ envoi: false, ok: false, erreur: d.message || 'Envoi impossible. Réessayez.' }); return; }
      setEtat({ envoi: false, ok: true, erreur: '' });
    } catch (err) {
      setEtat({ envoi: false, ok: false, erreur: 'Connexion impossible. Vérifiez internet et réessayez.' });
    }
  }

  return (
    <section id="accreditation" className="cef-section">
      <div className="cef-wrap">
        <p className="cef-eyebrow">Accréditations</p>
        <h2 className="cef-h2">Professionnels, presse et influenceurs</h2>
        <p className="cef-lead">Vous souhaitez couvrir le festival, rencontrer les compagnies ou partager l'événement avec votre communauté ? Faites votre demande, l'équipe vous recontacte.</p>

        {etat.ok ? (
          <div className="cef-carte cef-bl-blue cef-acc-merci">
            <h4>Merci {f.prenom} !</h4>
            <p>Votre demande est bien enregistrée. L'équipe du festival vous recontacte par WhatsApp ou par e-mail dans les prochains jours.</p>
            <a className="cef-btn cef-btn-dark" href="#programme">Voir le programme</a>
          </div>
        ) : (
          <form className="cef-acc" onSubmit={envoyer}>
            <div className="cef-acc-types" role="radiogroup" aria-label="Type de demande">
              {TYPES.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={type === t.id}
                  className={`cef-acc-type ${type === t.id ? 'is-active' : ''}`} onClick={() => setType(t.id)}>
                  <strong>{t.titre}</strong><span>{t.texte}</span>
                </button>
              ))}
            </div>

            {type && (
              <div className="cef-acc-champs">
                <div className="cef-acc-grille">
                  <label>Prénom *<input required value={f.prenom} onChange={maj('prenom')} autoComplete="given-name" /></label>
                  <label>Nom *<input required value={f.nom} onChange={maj('nom')} autoComplete="family-name" /></label>
                  <label>{influenceur ? 'Nom de votre page / pseudo' : type === 'presse' ? 'Média' : 'Structure'}<input value={f.structure} onChange={maj('structure')} /></label>
                  <label>{influenceur ? 'Thématique (humour, culture, lifestyle…)' : 'Fonction'}<input value={f.fonction} onChange={maj('fonction')} /></label>
                  <label>Téléphone / WhatsApp *<input required type="tel" inputMode="tel" value={f.telephone} onChange={maj('telephone')} autoComplete="tel" /></label>
                  <label>E-mail<input type="email" value={f.email} onChange={maj('email')} autoComplete="email" /></label>
                  <label>Ville / pays<input value={f.ville} onChange={maj('ville')} /></label>
                  {influenceur && (
                    <label>Nombre d'abonnés (total)<input inputMode="numeric" value={f.abonnes} onChange={maj('abonnes')} placeholder="ex. 12 000" /></label>
                  )}
                </div>

                {influenceur && (
                  <>
                    <p className="cef-acc-q">Vos réseaux *</p>
                    <div className="cef-acc-puces">
                      {RESEAUX.map((r) => (
                        <button key={r} type="button" className={reseaux.includes(r) ? 'is-active' : ''} onClick={() => basculer(reseaux, setReseaux, r)}>{r}</button>
                      ))}
                    </div>
                    <label className="cef-acc-plein">Lien de votre compte principal *
                      <input required type="url" value={f.lien} onChange={maj('lien')} placeholder="https://www.tiktok.com/@…" />
                    </label>
                  </>
                )}

                <p className="cef-acc-q">Jours de présence</p>
                <div className="cef-acc-puces">
                  {JOURS.map((j) => (
                    <button key={j} type="button" className={jours.includes(j) ? 'is-active' : ''} onClick={() => basculer(jours, setJours, j)}>{j}</button>
                  ))}
                </div>

                <label className="cef-acc-plein">{influenceur ? 'Ce que vous proposez (vidéos, lives, stories…)' : 'Votre demande en quelques mots'}
                  <textarea rows={4} value={f.message} onChange={maj('message')} />
                </label>
                <input className="cef-acc-piege" tabIndex={-1} autoComplete="off" value={f.site} onChange={maj('site')} aria-hidden="true" />

                {etat.erreur && <p className="cef-erreur" role="alert">{etat.erreur}</p>}
                <button type="submit" className="cef-btn cef-btn-primary" disabled={etat.envoi || (influenceur && !reseaux.length)}>
                  {etat.envoi ? 'Envoi…' : 'Envoyer ma demande'}
                </button>
                <p className="cef-mention">L'accréditation est confirmée par l'équipe, dans la limite des places disponibles.</p>
              </div>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
