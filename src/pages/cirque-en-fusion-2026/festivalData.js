// Contenu de la page Cirque en Fusion 2026 — tiré de la plaquette et du guide du village.
// Les TARIFS et JAUGES de la billetterie vivent dans Supabase (table festival_events) :
// ceux d'ici ne servent que de valeurs de secours si la base ne répond pas.

export const FESTIVAL = {
  titre: 'Cirque en Fusion',
  edition: '3ᵉ édition',
  theme: 'Rythmes et Corporalités',
  dates: '25 – 28 novembre 2026',
  ville: 'Cotonou, Bénin',
  accroche:
    "Le rendez-vous international des arts du cirque en Afrique de l'Ouest revient pour sa 3ᵉ édition, avec le plus large plateau artistique jamais réuni par le festival.",
  citationTheme: 'Le corps est le premier instrument. Le rythme en est l’âme.',
  contact: {
    email: 'circobenin@gmail.com',
    telephones: ['+229 01 52 76 33 33', '+229 01 96 14 63 60'],
    whatsapp: 'https://whatsapp.com/channel/0029Va9qhXd0lwgxoTcDoM1y',
    site: 'https://www.circobenin.com',
  },
};

export const CHIFFRES = [
  { valeur: '4', label: 'jours de festival' },
  { valeur: '7', label: 'pays et régions' },
  { valeur: '56', label: 'artistes sur scène' },
  { valeur: '11', label: 'compagnies invitées' },
  { valeur: '10', label: 'jeunes filles en première partie' },
];

export const COMPAGNIES = [
  { nom: 'Cie Thomas Guérineau (TG)', origine: 'France · Mali', artistes: 7, spectacles: ['Basketteuses de Bamako', 'Rêverie'] },
  { nom: 'Cie FABARA', origine: 'Conakry, Guinée', artistes: 7, spectacles: ['Fabara'] },
  { nom: 'Cie Dafra', origine: 'Bobo-Dioulasso, Burkina Faso', artistes: 5, spectacles: ['Arrêt de bus', 'Souffle'] },
  { nom: 'Cie Afuma', origine: 'Togo', artistes: 5, spectacles: ['La Roulotte', 'Afuma'] },
  { nom: 'Cie Ça Sent le Roussi', origine: 'Belgique', artistes: 2, spectacles: [] },
  { nom: 'Duo de jongleurs', origine: 'France', artistes: 2, spectacles: [] },
  { nom: 'Circo Bénin', origine: 'Cotonou', artistes: 4, spectacles: ['Entre 2'] },
  { nom: 'Cie All Circus', origine: 'Cotonou', artistes: 5, spectacles: ['Astres resplendissantes'] },
  { nom: 'Cotonou Cirk Compagnie', origine: 'Cotonou', artistes: 8, spectacles: [] },
  { nom: "Les Monocyclistes d'Abomey", origine: 'Abomey', artistes: 5, spectacles: [] },
  { nom: 'Acroforce de Parakou', origine: 'Parakou', artistes: 6, spectacles: [] },
];

// type : spectacle | atelier | pro | animation | parade | stands | scolaire
// acces : gratuit | payant | null ; billet : slug de festival_events pour les spectacles en vente
export const PROGRAMME = [
  {
    jour: '25', nomJour: 'Mercredi 25 novembre', sousTitre: 'Ouverture · fermeture à minuit', couleur: 'pink',
    items: [
      { heure: '10h00', titre: 'Conférence de presse', type: 'pro', lieu: 'Village' },
      { heure: '15h00', titre: "Parade de cirque et cérémonie d'ouverture", type: 'parade', lieu: 'Village' },
      { heure: '16h30', titre: 'La Roulotte', compagnie: 'Cie Afuma', type: 'spectacle', lieu: 'Village', acces: 'gratuit', tempsFort: true },
      { heure: '18h30', titre: 'Animation sur site', type: 'animation', lieu: 'Village', acces: 'gratuit' },
      { heure: '20h00', titre: 'Basketteuses de Bamako', compagnie: 'Cie Thomas Guérineau', type: 'spectacle', lieu: 'Institut français de Cotonou', acces: 'payant', tempsFort: true, billet: 'basketteuses-25',
        note: "Première partie : 10 jeunes filles formées par Circo Bénin, en lien avec la Journée internationale pour l'élimination de la violence à l'égard des femmes." },
      { heure: '22h00', titre: 'Scène acoustique et DJ femmes', type: 'animation', lieu: 'Village', acces: 'gratuit' },
    ],
  },
  {
    jour: '26', nomJour: 'Jeudi 26 novembre', sousTitre: 'Jeune public · rencontres pro · fermeture à minuit', couleur: 'plum',
    items: [
      { heure: '9h30', titre: 'Rêverie · séance scolaire n° 1', type: 'scolaire', lieu: 'Site de Circo Bénin', acces: 'payant' },
      { heure: '10h45', titre: 'Rêverie · séance scolaire n° 2', type: 'scolaire', lieu: 'Site de Circo Bénin', acces: 'payant' },
      { heure: '14h00', titre: 'Ouverture des stands', type: 'stands', lieu: 'Village' },
      { heure: '15h00', titre: 'Rencontres professionnelles', type: 'pro', lieu: 'Village' },
      { heure: '18h00', titre: 'Arrêt de bus', compagnie: 'Cie Dafra', type: 'spectacle', lieu: 'Village', acces: 'gratuit' },
      { heure: '19h30', titre: 'Entre 2', compagnie: 'Cie Circo Bénin', type: 'spectacle', lieu: 'Village', acces: 'payant', billet: 'jarre-sacre-26' },
      { heure: '20h30', titre: 'Souffle', compagnie: 'Cie Dafra', type: 'spectacle', lieu: 'Village', acces: 'payant', billet: 'souffle-26' },
      { heure: '21h30', titre: 'Soirée DJ femmes', type: 'animation', lieu: 'Village', acces: 'gratuit' },
    ],
  },
  {
    jour: '27', nomJour: 'Vendredi 27 novembre', sousTitre: 'Ateliers · spectacles · Gala Feu · fermeture à minuit', couleur: 'blue',
    items: [
      { heure: '9h30', titre: 'Rêverie · séance scolaire n° 1 (reprise)', type: 'scolaire', lieu: 'Site de Circo Bénin', acces: 'payant' },
      { heure: '10h45', titre: 'Rêverie · séance scolaire n° 2 (reprise)', type: 'scolaire', lieu: 'Site de Circo Bénin', acces: 'payant' },
      { heure: '14h00', titre: 'Ouverture des stands', type: 'stands', lieu: 'Village' },
      { heure: '16h00', titre: 'Atelier cirque', type: 'atelier', lieu: 'Village', acces: 'gratuit' },
      { heure: '17h00', titre: "Les Monocyclistes d'Abomey", type: 'spectacle', lieu: 'Village', acces: 'gratuit' },
      { heure: '17h30', titre: 'Astres resplendissantes', compagnie: 'Cie All Circus', type: 'spectacle', lieu: 'Village', acces: 'gratuit' },
      { heure: '18h00', titre: 'Fabara', compagnie: 'Cie FABARA', type: 'spectacle', lieu: 'Village', acces: 'payant', billet: 'fabara-27' },
      { heure: '20h30', titre: 'Gala Feu', type: 'spectacle', lieu: 'Village', acces: 'payant', tempsFort: true, billet: 'gala-feu-27' },
      { heure: '21h30', titre: 'Soirée DJ femmes', type: 'animation', lieu: 'Village', acces: 'gratuit' },
    ],
  },
  {
    jour: '28', nomJour: 'Samedi 28 novembre', sousTitre: 'Clôture · fermeture à 1h', couleur: 'yellow',
    items: [
      { heure: '10h00', titre: 'Atelier cirque en famille', type: 'atelier', lieu: 'Village', acces: 'gratuit' },
      { heure: '10h00', titre: 'Ouverture des stands', type: 'stands', lieu: 'Village' },
      { heure: '15h00', titre: 'Flash mob « La folle petite minute »', type: 'animation', lieu: 'Village', acces: 'gratuit' },
      { heure: '15h30', titre: 'Atelier cirque', type: 'atelier', lieu: 'Village', acces: 'gratuit' },
      { heure: '17h00', titre: 'La Roulotte', compagnie: 'Cie Afuma', type: 'spectacle', lieu: 'Village', acces: 'gratuit' },
      { heure: '20h00', titre: 'Gala Show et remise de prix VIP', type: 'spectacle', lieu: 'Village', acces: 'payant', tempsFort: true, billet: 'gala-show-28',
        note: 'Place normale 3 000 FCFA · place VIP 15 000 FCFA.' },
      { heure: '22h00', titre: 'Soirée DJ femmes de clôture', type: 'animation', lieu: 'Village', acces: 'gratuit' },
    ],
  },
];

export const TYPES = {
  spectacle: 'Spectacle', atelier: 'Atelier', pro: 'Rencontre pro', animation: 'Animation · DJ',
  parade: 'Parade · cérémonie', stands: 'Stands', scolaire: 'Séance scolaire',
};

// Valeurs de secours — LA SOURCE DE VÉRITÉ EST LA TABLE festival_events.
// Tarifs : 3 000 FCFA par spectacle ; Gala Show 3 000 FCFA (normal) ou 15 000 FCFA (VIP).
// ⚠️ Jauge du village (300) provisoire, à confirmer.
export const BILLETS_SECOURS = [
  { slug: 'basketteuses-25', titre: 'Basketteuses de Bamako', compagnie: 'Cie Thomas Guérineau', date_label: 'Mer. 25 nov. · 20h00', lieu: 'Institut français de Cotonou', prix_fcfa: 3000, places_restantes: 400 },
  { slug: 'jarre-sacre-26', titre: 'Entre 2', compagnie: 'Cie Circo Bénin', date_label: 'Jeu. 26 nov. · 19h30', lieu: 'Village du festival, Agla', prix_fcfa: 3000, places_restantes: 300 },
  { slug: 'souffle-26', titre: 'Souffle', compagnie: 'Cie Dafra', date_label: 'Jeu. 26 nov. · 20h30', lieu: 'Village du festival, Agla', prix_fcfa: 3000, places_restantes: 300 },
  { slug: 'fabara-27', titre: 'Fabara', compagnie: 'Cie FABARA', date_label: 'Ven. 27 nov. · 18h00', lieu: 'Village du festival, Agla', prix_fcfa: 3000, places_restantes: 300 },
  { slug: 'gala-feu-27', titre: 'Gala Feu', compagnie: null, date_label: 'Ven. 27 nov. · 20h30', lieu: 'Village du festival, Agla', prix_fcfa: 3000, places_restantes: 300 },
  { slug: 'gala-show-28', titre: 'Gala Show · place normale', compagnie: null, date_label: 'Sam. 28 nov. · 20h00', lieu: 'Village du festival, Agla', prix_fcfa: 3000, places_restantes: 300 },
  { slug: 'gala-show-vip-28', titre: 'Gala Show · place VIP', compagnie: 'Remise de prix VIP', date_label: 'Sam. 28 nov. · 20h00', lieu: 'Village du festival, Agla', prix_fcfa: 15000, places_restantes: 50 },
];

export const ESPACES_VILLAGE = [
  { n: 1, nom: 'La Grande Salle', desc: 'Le grand bâtiment du village.' },
  { n: 2, nom: 'La scène', desc: 'Au centre de l’espace extérieur, avec gradins. Spectacles extérieurs en accès libre.' },
  { n: 3, nom: 'Restauration', desc: 'Trois points « Resto » dans le village.' },
  { n: 4, nom: 'La buvette', desc: 'En bas de l’espace extérieur, à côté des restos.' },
  { n: 5, nom: 'Les sorties', desc: 'Deux sorties : côté gauche et en bas du village.' },
  { n: 6, nom: 'La régie', desc: 'Près de la scène.' },
  { n: 7, nom: 'La zone des stands', desc: '30 emplacements d’exposants, à côté de la Grande Salle.' },
  { n: 8, nom: 'L’entrée de la Grande Salle', desc: 'Côté zone des stands.' },
];

export const PARCOURS = [
  {
    titre: 'En famille', couleur: 'blue',
    points: [
      'Ateliers de cirque gratuits : ven. 16h, sam. 10h (en famille) et 15h30',
      'Flash mob « La folle petite minute », samedi 15h',
      'Spectacles gratuits : La Roulotte (mer. 16h30, sam. 17h), Arrêt de bus (jeu. 18h), Astres resplendissantes (ven. 17h30)',
    ],
  },
  {
    titre: 'Soirées', couleur: 'pink',
    points: [
      'Mercredi 20h : Basketteuses de Bamako, à l’IFB',
      'Jeudi 19h30 Entre 2, 20h30 Souffle',
      'Vendredi 20h30 : Gala Feu',
      'Samedi 20h : Gala Show et remise de prix',
      'Chaque soir : DJ femmes, en accès libre',
    ],
  },
  {
    titre: 'Professionnels', couleur: 'plum',
    points: [
      'Mercredi 10h : conférence de presse',
      'Jeudi 15h : rencontres professionnelles (table ronde, speed-meetings, déjeuner de networking)',
      'Accréditation sur demande : circobenin@gmail.com',
    ],
  },
];

export const formatFcfa = (n) => `${new Intl.NumberFormat('fr-FR').format(n).replace(/ /g, ' ')} FCFA`;
