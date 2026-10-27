// Route : /cirque-en-fusion-2026 — fenêtre publique du festival dans app.circobenin.com
import { useEffect, useState } from 'react';
import Billetterie from './Billetterie';
import PlanVillage from './PlanVillage';
import {
  FESTIVAL, CHIFFRES, COMPAGNIES, PROGRAMME, TYPES, ESPACES_VILLAGE, PARCOURS,
} from './festivalData';
import './cirque-en-fusion-2026.css';

import heroCover from './assets/hero-cover.webp';
import visuelCarre from './assets/visuel-carre.webp';
import photoCerceau from './assets/photo-cerceau-duo.webp';
import photoTheme from './assets/photo-theme.webp';
import photoTissu from './assets/photo-tissu.webp';
import photoBalais from './assets/photo-balais.webp';
import photoEnfants from './assets/photo-enfants.webp';

const SECTIONS = [
  { id: 'edition', label: "L'édition" },
  { id: 'programme', label: 'Programme' },
  { id: 'village', label: 'Le village' },
  { id: 'billetterie', label: 'Billetterie' },
  { id: 'infos', label: 'Infos pratiques' },
];

function NavFestival() {
  const [actif, setActif] = useState('edition');
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && setActif(en.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);
  return (
    <nav className="cef-nav" aria-label="Sections du festival">
      <div className="cef-nav-inner">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className={actif === s.id ? 'is-active' : ''}>{s.label}</a>
        ))}
        <a href="#billetterie" className="cef-nav-cta">Réserver</a>
      </div>
    </nav>
  );
}

function Programme() {
  const [jour, setJour] = useState(0);
  const [filtre, setFiltre] = useState('tout');
  const j = PROGRAMME[jour];
  const items = j.items.filter((it) => filtre === 'tout' || it.acces === filtre);
  return (
    <>
      <div className="cef-jours" role="tablist" aria-label="Jours du festival">
        {PROGRAMME.map((d, i) => (
          <button
            key={d.jour} role="tab" aria-selected={jour === i}
            className={`cef-jour cef-c-${d.couleur} ${jour === i ? 'is-active' : ''}`}
            onClick={() => setJour(i)}
          >
            <span className="cef-jour-num">{d.jour}</span>
            <span className="cef-jour-nom">{d.nomJour.split(' ')[0]}</span>
          </button>
        ))}
      </div>
      <div className="cef-prog-tete">
        <div>
          <h3>{j.nomJour}</h3>
          <p>{j.sousTitre}</p>
        </div>
        <div className="cef-filtres" role="group" aria-label="Filtrer">
          {[['tout', 'Tout'], ['gratuit', 'Gratuit'], ['payant', 'Payant']].map(([v, l]) => (
            <button key={v} className={filtre === v ? 'is-active' : ''} onClick={() => setFiltre(v)} aria-pressed={filtre === v}>{l}</button>
          ))}
        </div>
      </div>
      <ol className="cef-timeline" role="tabpanel">
        {items.map((it) => (
          <li key={it.heure + it.titre} className={`cef-t-${it.type} ${it.tempsFort ? 'is-fort' : ''}`}>
            <time>{it.heure}</time>
            <div className="cef-item">
              <div className="cef-item-main">
                {it.tempsFort && <p className="cef-fort">★ Temps fort</p>}
                <h4>{it.type === 'spectacle' ? `Spectacle ${it.titre}` : it.titre}</h4>
                <p className="cef-item-meta">
                  <span className="cef-type">{TYPES[it.type]}</span>
                  {it.compagnie && <span>{it.compagnie}</span>}
                  <span className={it.lieu !== 'Village' ? 'cef-hors' : ''}>{it.lieu === 'Village' ? 'Village du festival' : it.lieu}</span>
                </p>
                {it.note && <p className="cef-item-note">{it.note}</p>}
              </div>
              <div className="cef-item-side">
                {it.acces === 'gratuit' && <span className="cef-badge cef-badge-free">Gratuit</span>}
                {it.acces === 'payant' && <span className="cef-badge cef-badge-dark">Payant</span>}
                {it.billet && <a className="cef-lien-billet" href="#billetterie">Réserver →</a>}
                {it.type === 'scolaire' && <a className="cef-lien-billet" href="#scolaires">Réserver pour une classe →</a>}
              </div>
            </div>
          </li>
        ))}
        {!items.length && <li className="cef-vide">Rien dans cette catégorie ce jour-là.</li>}
      </ol>
      <p className="cef-mention">Programme susceptible d'ajustements.</p>
    </>
  );
}

function Village() {
  const [actif, setActif] = useState(2);
  return (
    <div className="cef-village-grid">
      <div className="cef-plan-wrap">
        <PlanVillage actif={actif} onSelect={setActif} />
        <p className="cef-mention">Plan schématique, non à l'échelle. Survolez ou touchez un repère.</p>
      </div>
      <ul className="cef-legende">
        {ESPACES_VILLAGE.map((e) => (
          <li key={e.n}>
            <button type="button" className={actif === e.n ? 'is-active' : ''} onClick={() => setActif(e.n)}>
              <span className={`cef-num cef-num-${e.n}`}>{e.n}</span>
              <span><strong>{e.nom}</strong><span>{e.desc}</span></span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CirqueEnFusion2026() {
  useEffect(() => {
    const ancien = document.title;
    document.title = 'Cirque en Fusion 2026 · 25–28 nov. · Cotonou';
    return () => { document.title = ancien; };
  }, []);

  const { contact } = FESTIVAL;
  const mail = (sujet) => `mailto:${contact.email}?subject=${encodeURIComponent(sujet)}`;

  return (
    <div className="cef-page">
      {/* HERO */}
      <header className="cef-hero">
        <picture>
          <source media="(max-width: 700px)" srcSet={visuelCarre} />
          <img src={heroCover} alt="Festival Cirque en Fusion #3 — 25 au 28 novembre 2026, Cotonou, Bénin" className="cef-hero-img" />
        </picture>
        <div className="cef-hero-bar">
          <div>
            <p className="cef-kicker">{FESTIVAL.edition} · Festival international des arts du cirque</p>
            <p className="cef-hero-theme">Thème 2026 : <strong>{FESTIVAL.theme}</strong></p>
          </div>
          <div className="cef-hero-actions">
            <a href="#billetterie" className="cef-btn cef-btn-primary">Acheter des billets</a>
            <a href="#programme" className="cef-btn cef-btn-ghost">Voir le programme</a>
          </div>
        </div>
      </header>

      <NavFestival />

      {/* L'ÉDITION */}
      <section id="edition" className="cef-section">
        <div className="cef-wrap cef-intro">
          <div>
            <p className="cef-eyebrow">L'édition 2026</p>
            <h2 className="cef-h2">Le cirque contemporain africain a rendez-vous à Cotonou</h2>
            <p className="cef-lead">{FESTIVAL.accroche}</p>
            <p>Organisé par Circo Bénin – École des Arts du Cirque, Cirque en Fusion réunit artistes, compagnies et professionnels autour d'une programmation exigeante et festive, accessible à tous les publics. Quatre jours de spectacles, d'ateliers, de rencontres professionnelles et de découvertes, entre le village du festival à Agla et l'Institut français de Cotonou.</p>
          </div>
          <figure className="cef-photo">
            <img src={photoCerceau} alt="Duo au cerceau aérien" loading="lazy" />
            <figcaption>© Thiéry Koudjou</figcaption>
          </figure>
        </div>

        <div className="cef-chiffres">
          {CHIFFRES.map((c, i) => (
            <div key={c.label} className={`cef-chiffre cef-c-${['yellow', 'pink', 'yellow', 'pink', 'yellow'][i]}`}>
              <strong>{c.valeur}</strong><span>{c.label}</span>
            </div>
          ))}
        </div>

        <div className="cef-theme" style={{ '--bg': `url(${photoTheme})` }}>
          <div className="cef-wrap cef-theme-inner">
            <p className="cef-eyebrow cef-eyebrow-y">Thématique 2026</p>
            <h2 className="cef-theme-titre">Rythmes<br /><span>et Corporalités</span></h2>
            <div className="cef-theme-cols">
              <p className="cef-theme-q">Comment la musique traverse-t-elle le corps de l'acrobate ? Comment les traditions rythmiques africaines nourrissent-elles la gestuelle circassienne contemporaine ?</p>
              <p>Des disciplines héritées de traditions acrobatiques ancestrales, réinventées au contact d'influences contemporaines, mondiales et locales. Les artistes invités ont été choisis pour leur capacité à incarner ce dialogue, de la poésie intime au grand spectacle populaire.</p>
            </div>
            <blockquote>{FESTIVAL.citationTheme}</blockquote>
          </div>
        </div>

        <div className="cef-wrap">
          <div className="cef-artistes-tete">
            <div>
              <p className="cef-eyebrow">Les artistes</p>
              <h2 className="cef-h2">56 artistes, 7 pays et régions</h2>
            </div>
            <p>Onze compagnies du Bénin, d'Afrique de l'Ouest et d'Europe : le plus large plateau jamais réuni par le festival.</p>
          </div>
          <ul className="cef-compagnies">
            {COMPAGNIES.map((c) => (
              <li key={c.nom}>
                <span className="cef-cie-nb">{c.artistes}</span>
                <div>
                  <strong>{c.nom}</strong>
                  <span>{[...c.spectacles, c.origine].join(' · ')}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="cef-femmes">
            <img src={photoBalais} alt="Artiste du festival avec des balais traditionnels" loading="lazy" />
            <div>
              <p className="cef-eyebrow cef-eyebrow-y">Les femmes à l'honneur</p>
              <p><strong>En première partie :</strong> 10 jeunes filles formées par Circo Bénin du 21 au 25 novembre ouvrent la soirée du 25, en lien avec la Journée internationale pour l'élimination de la violence à l'égard des femmes.</p>
              <p><strong>Aux platines :</strong> chaque soir, des DJ femmes animent le village, parce que promouvoir les femmes dans ce milieu est un axe fort du festival.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMME */}
      <section id="programme" className="cef-section cef-section-paper">
        <div className="cef-wrap">
          <p className="cef-eyebrow">Programmation</p>
          <h2 className="cef-h2">Quatre jours, de la parade au Gala Show</h2>
          <Programme />
        </div>
      </section>

      {/* VILLAGE */}
      <section id="village" className="cef-section">
        <div className="cef-wrap">
          <p className="cef-eyebrow">Le village du festival · quartier d'Agla</p>
          <h2 className="cef-h2">Un village pour passer la journée et la soirée</h2>
          <p className="cef-lead">On y vient voir des spectacles, pratiquer, découvrir les stands, se restaurer et se retrouver, de l'après-midi jusqu'à la nuit.</p>

          <div className="cef-cartes4">
            <div className="cef-carte cef-bt-pink"><h4>Spectacles en plein air</h4><p>Une scène extérieure avec gradins. Les spectacles extérieurs sont en accès libre et gratuit.</p></div>
            <div className="cef-carte cef-bt-blue"><h4>Ateliers gratuits</h4><p>Jonglerie, acrobatie, équilibre, tissu aérien : ouverts à tous les âges les 27 et 28 novembre.</p></div>
            <div className="cef-carte cef-bt-yellow"><h4>Stands et exposants</h4><p>30 emplacements, ouverts dès 14h les 26 et 27 novembre, dès 10h le 28.</p></div>
            <div className="cef-carte cef-bt-plum"><h4>Soirées DJ femmes</h4><p>Chaque soir, des DJ femmes prennent les platines.</p></div>
          </div>

          <Village />

          <h3 className="cef-h3">Que faire, selon vous ?</h3>
          <div className="cef-parcours">
            {PARCOURS.map((p) => (
              <div key={p.titre} className={`cef-carte cef-bl-${p.couleur}`}>
                <h4>{p.titre}</h4>
                <ul>{p.points.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ))}
          </div>

          <div className="cef-stands">
            <div>
              <p className="cef-eyebrow cef-eyebrow-y">Exposer au village</p>
              <h3>Louez un stand pour tout le festival</h3>
              <p>30 emplacements dans la zone à côté de la Grande Salle · 1 prise électrique incluse.</p>
            </div>
            <div className="cef-stands-prix">
              <div><strong>100 000 FCFA</strong><span>Stand avec tente</span></div>
              <div className="is-y"><strong>80 000 FCFA</strong><span>Espace vide</span></div>
            </div>
            <a className="cef-btn cef-btn-primary" href={mail('Réservation stand – Cirque en Fusion 2026')}>Réserver un stand</a>
          </div>
        </div>
      </section>

      {/* BILLETTERIE */}
      <section id="billetterie" className="cef-section cef-section-paper">
        <div className="cef-wrap">
          <p className="cef-eyebrow">Billetterie</p>
          <h2 className="cef-h2">Réservez vos places</h2>
          <p className="cef-lead">L'entrée du village est libre et gratuite, comme les spectacles extérieurs, les ateliers et les soirées DJ. Les billets ci-dessous concernent les spectacles payants : 3 000 FCFA la place, 15 000 FCFA en VIP pour le Gala Show.</p>
          <Billetterie />

          <div id="scolaires" className="cef-encarts">
            <figure className="cef-photo cef-photo-sm">
              <img src={photoEnfants} alt="Enfants découvrant le cirque" loading="lazy" />
            </figure>
            <div className="cef-carte cef-bl-blue">
              <h4>Écoles · séances scolaires de Rêverie</h4>
              <p>Jeudi 26 et vendredi 27 novembre, 9h30 et 10h45, sur le site de Circo Bénin. Pour les 6–18 ans, avec introduction pédagogique et échange avec les artistes. <strong>3 000 FCFA par élève</strong>, transport en bus organisé depuis l'établissement, fiches pédagogiques remises en amont.</p>
              <a className="cef-btn cef-btn-dark" href={mail('Réservation séance scolaire Rêverie – Cirque en Fusion 2026')}>Réserver pour une classe</a>
            </div>
            <div className="cef-carte cef-bl-plum">
              <h4>Professionnels · accréditation</h4>
              <p>Accès à tous les spectacles payants, aux rencontres professionnelles du jeudi 26 à 15h (table ronde, speed-meetings, déjeuner de networking) et à un espace presse dédié.</p>
              <a className="cef-btn cef-btn-dark" href={mail('Demande d’accréditation – Cirque en Fusion 2026')}>Demander une accréditation</a>
            </div>
          </div>
        </div>
      </section>

      {/* INFOS PRATIQUES */}
      <section id="infos" className="cef-section cef-section-dark">
        <div className="cef-wrap cef-infos">
          <div>
            <p className="cef-eyebrow cef-eyebrow-y">Infos pratiques</p>
            <h2 className="cef-h2">À savoir avant de venir</h2>
            <dl>
              <dt>Dates</dt><dd>Du mercredi 25 au samedi 28 novembre 2026</dd>
              <dt>Lieu</dt><dd>Village du festival, quartier d'Agla, Cotonou. Spectacle du 25 à 20h à l'Institut français de Cotonou (400 places) ; séances scolaires sur le site de Circo Bénin.</dd>
              <dt>Accès libre</dt><dd>Entrée du village gratuite, comme les spectacles extérieurs, les ateliers et les soirées DJ.</dd>
              <dt>Tarifs</dt><dd>Spectacles payants : 3 000 FCFA. Gala Show : 3 000 FCFA, ou 15 000 FCFA en VIP. Séances scolaires : 3 000 FCFA par élève.</dd>
              <dt>Fermeture</dt><dd>Minuit les 25, 26 et 27 novembre ; 1h le 28.</dd>
              <dt>Contact</dt>
              <dd>
                <a href={`mailto:${contact.email}`}>{contact.email}</a><br />
                {contact.telephones.map((t) => <span key={t}><a href={`tel:${t.replace(/\s/g, '')}`}>{t}</a><br /></span>)}
              </dd>
            </dl>
          </div>
          <div className="cef-suivre">
            <img src={photoTissu} alt="Artiste au tissu aérien" loading="lazy" />
            <h3>Suivez le festival</h3>
            <p>Les annonces, les coulisses et les changements de dernière minute passent d'abord par la chaîne WhatsApp.</p>
            <a className="cef-btn cef-btn-primary" href={contact.whatsapp} target="_blank" rel="noreferrer">Rejoindre la chaîne WhatsApp</a>
          </div>
        </div>
        <footer className="cef-foot">Circo Bénin – École des Arts du Cirque · Cirque en Fusion · 3ᵉ édition · 25–28 novembre 2026 · Cotonou</footer>
      </section>
    </div>
  );
}
