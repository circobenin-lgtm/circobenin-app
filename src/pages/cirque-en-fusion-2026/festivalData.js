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
  { valeur: '6', label: 'pays et régions' },
  { valeur: '54', label: 'artistes sur scène' },
  { valeur: '10', label: 'compagnies invitées' },
  { valeur: '30', label: 'places au workshop de Thomas Guérineau' },
];

export const COMPAGNIES = [
  { nom: 'Cie Thomas Guérineau (TG)', origine: 'France · Mali', artistes: 7, spectacles: ['Basketteuses de Bamako', 'Petite Rêverie'] },
  { nom: 'Cie FABARA', origine: 'Conakry, Guinée', artistes: 7, spectacles: ['Fabara'] },
  { nom: 'Cie Dafra', origine: 'Bobo-Dioulasso, Burkina Faso', artistes: 5, spectacles: ['Arrêt de bus', 'Souffle'] },
  { nom: 'Cie Afuma', origine: 'Togo', artistes: 5, spectacles: ['La Roulotte'] },
  { nom: 'Duo Lucas Devillers & Loup Pinel', origine: 'France', artistes: 2, spectacles: ['Spectacle Feu', 'La pluie et le beau temps'] },
  { nom: 'Circo Bénin', origine: 'Cotonou', artistes: 4, spectacles: [] },
  { nom: 'Cie All Circus', origine: 'Cotonou', artistes: 5, spectacles: ['Astres resplendissantes'] },
  { nom: 'Cotonou Cirk Compagnie', origine: 'Cotonou', artistes: 8, spectacles: ['Jarre Sacré'] },
  { nom: "Les Monocyclistes d'Abomey", origine: 'Abomey', artistes: 5, spectacles: [] },
  { nom: 'Acroforce de Parakou', origine: 'Parakou', artistes: 6, spectacles: [] },
];

// type : spectacle | atelier | pro | animation | parade | stands | scolaire
// acces : gratuit | payant | null ; billet : slug de festival_events pour les spectacles en vente
export const PROGRAMME = [
  {
    jour: '25', nomJour: 'Mercredi 25 novembre', sousTitre: 'Ouverture · fermeture à minuit', couleur: 'pink',
    items: [
      { heure: '15h00', titre: "Parade de cirque et cérémonie d'ouverture", type: 'parade', lieu: "Quartier d'Agla", acces: 'gratuit' },
      { heure: '16h30', titre: 'La Roulotte', compagnie: 'Cie Afuma', type: 'spectacle', lieu: 'Scène extérieure · Maison des Jeunes d’Agla', acces: 'gratuit' },
      { heure: '17h15', titre: 'Arrêt de bus', compagnie: 'Cie Dafra', type: 'spectacle', lieu: 'Grande Salle · Maison des Jeunes d’Agla', acces: 'payant', billet: 'arret-de-bus-25' },
      { heure: '18h30', titre: 'Basketteuses de Bamako', compagnie: 'Cie Thomas Guérineau', type: 'spectacle', lieu: 'Institut français de Cotonou', acces: 'payant', tempsFort: true, billet: 'basketteuses-25' },
      { heure: '20h30', titre: 'Feu', compagnie: 'Duo Lucas Devillers & Loup Pinel (France)', type: 'spectacle', lieu: 'Esplanade · Maison des Jeunes d’Agla', acces: 'gratuit', tempsFort: true },
      { heure: '22h00', titre: 'Animation du village', type: 'animation', lieu: 'Village', acces: 'gratuit' },
    ],
  },
  {
    jour: '26', nomJour: 'Jeudi 26 novembre', sousTitre: 'Jeune public · rencontres pro · fermeture à minuit', couleur: 'plum',
    items: [
      { heure: '9h30', titre: 'Ouverture des stands', type: 'stands', lieu: 'Village' },
      { heure: '9h30', titre: 'Petite Rêverie · séance scolaire n° 1', compagnie: 'Cie Thomas Guérineau', type: 'scolaire', lieu: 'Maison des Jeunes d’Agla', acces: 'payant' },
      { heure: '10h15', titre: 'Petite Rêverie · séance scolaire n° 2', compagnie: 'Cie Thomas Guérineau', type: 'scolaire', lieu: 'Maison des Jeunes d’Agla', acces: 'payant' },
      { heure: '15h00', titre: 'Rencontres professionnelles', type: 'pro', lieu: 'Site de Circo Bénin' },
      { heure: '17h15', titre: 'La Roulotte', compagnie: 'Cie Afuma', type: 'spectacle', lieu: 'Scène extérieure · Maison des Jeunes d’Agla', acces: 'gratuit' },
      { heure: '18h15', titre: "Les Monocyclistes d'Abomey", type: 'spectacle', lieu: 'Scène extérieure · Maison des Jeunes d’Agla', acces: 'gratuit' },
      { heure: '19h00', titre: 'Acroforce de Parakou', type: 'spectacle', lieu: 'Scène extérieure · Maison des Jeunes d’Agla', acces: 'gratuit' },
      { heure: '19h30', titre: 'Astres resplendissantes', compagnie: 'Cie All Circus', type: 'spectacle', lieu: 'Grande Salle · Maison des Jeunes d’Agla', acces: 'payant', billet: 'astres-26' },
      { heure: '20h30', titre: 'Souffle', compagnie: 'Cie Dafra', type: 'spectacle', lieu: 'Grande Salle · Maison des Jeunes d’Agla', acces: 'payant', billet: 'souffle-26' },
      { heure: '21h30', titre: 'Animation du village', type: 'animation', lieu: 'Village', acces: 'gratuit' },
    ],
  },
  {
    jour: '27', nomJour: 'Vendredi 27 novembre', sousTitre: 'Ateliers · spectacles · Spectacle Feu · fermeture à minuit', couleur: 'blue',
    items: [
      { heure: '9h30', titre: 'Ouverture des stands', type: 'stands', lieu: 'Village' },
      { heure: '9h30', titre: 'La pluie et le beau temps · séance scolaire n° 1', compagnie: 'Loup Pinel', type: 'scolaire', lieu: 'Maison des Jeunes d’Agla', acces: 'payant' },
      { heure: '10h15', titre: 'La pluie et le beau temps · séance scolaire n° 2', compagnie: 'Loup Pinel', type: 'scolaire', lieu: 'Maison des Jeunes d’Agla', acces: 'payant' },
      { heure: '16h00', titre: 'Atelier cirque', type: 'atelier', lieu: 'Village', acces: 'gratuit' },
      { heure: '16h30', titre: "Les Monocyclistes d'Abomey", type: 'spectacle', lieu: 'Scène extérieure · Maison des Jeunes d’Agla', acces: 'gratuit' },
      { heure: '17h00', titre: 'Acroforce de Parakou', type: 'spectacle', lieu: 'Scène extérieure · Maison des Jeunes d’Agla', acces: 'gratuit' },
      { heure: '17h30', titre: 'La Roulotte', compagnie: 'Cie Afuma', type: 'spectacle', lieu: 'Scène extérieure · Maison des Jeunes d’Agla', acces: 'gratuit' },
      { heure: '18h00', titre: 'Fabara', compagnie: 'Cie FABARA', type: 'spectacle', lieu: 'Grande Salle · Maison des Jeunes d’Agla', acces: 'payant', billet: 'fabara-27' },
      { heure: '18h45', titre: 'Arrêt de bus', compagnie: 'Cie Dafra', type: 'spectacle', lieu: 'Grande Salle · Maison des Jeunes d’Agla', acces: 'payant', billet: 'arret-de-bus-27' },
      { heure: '20h00', titre: 'Feu', compagnie: 'Duo Lucas Devillers & Loup Pinel (France)', type: 'spectacle', lieu: 'Esplanade · Maison des Jeunes d’Agla', acces: 'gratuit', tempsFort: true },
      { heure: '21h00', titre: 'Jarre Sacré', compagnie: 'Cotonou Cirk Compagnie', type: 'spectacle', lieu: 'Grande Salle · Maison des Jeunes d’Agla', acces: 'payant', billet: 'jarre-sacre-27' },
      { heure: '22h00', titre: 'Animation du village', type: 'animation', lieu: 'Village', acces: 'gratuit' },
    ],
  },
  {
    jour: '28', nomJour: 'Samedi 28 novembre', sousTitre: 'Clôture · fermeture à 1h', couleur: 'yellow',
    items: [
      { heure: '9h30', titre: 'Ouverture des stands', type: 'stands', lieu: 'Village' },
      { heure: '10h00', titre: 'Atelier cirque en famille', type: 'atelier', lieu: 'Village', acces: 'gratuit' },
      { heure: '11h00', titre: 'La pluie et le beau temps', compagnie: 'Loup Pinel', type: 'spectacle', lieu: 'Grande Salle · Maison des Jeunes d’Agla', acces: 'payant', billet: 'pluie-28' },
      { heure: '14h30', titre: 'Souffle', compagnie: 'Cie Dafra', type: 'spectacle', lieu: 'Grande Salle · Maison des Jeunes d’Agla', acces: 'payant', billet: 'souffle-28' },
      { heure: '15h00', titre: 'Flash mob « La folle petite minute »', type: 'animation', lieu: 'Village', acces: 'gratuit' },
      { heure: '15h30', titre: 'Atelier cirque', type: 'atelier', lieu: 'Village', acces: 'gratuit' },
      { heure: '16h00', titre: 'Fabara', compagnie: 'Cie FABARA', type: 'spectacle', lieu: 'Grande Salle · Maison des Jeunes d’Agla', acces: 'payant', billet: 'fabara-28' },
      { heure: '16h30', titre: 'La Roulotte', compagnie: 'Cie Afuma', type: 'spectacle', lieu: 'Scène extérieure · Maison des Jeunes d’Agla', acces: 'gratuit' },
      { heure: '20h00', titre: 'Gala et remise de prix', sansPrefixe: true, type: 'spectacle', lieu: 'Grande Salle · Maison des Jeunes d’Agla', acces: 'payant', tempsFort: true, billet: 'gala-show-28',
        note: 'Place normale 3 000 FCFA · place VIP 15 000 FCFA.' },
      { heure: '22h00', titre: 'Soirée de clôture', type: 'animation', lieu: 'Village', acces: 'gratuit' },
    ],
  },
];

export const TYPES = {
  spectacle: 'Spectacle', atelier: 'Atelier', pro: 'Rencontre pro', animation: 'Animation · DJ',
  parade: 'Parade · cérémonie', stands: 'Stands', scolaire: 'Séance scolaire',
};

// Valeurs de secours — LA SOURCE DE VÉRITÉ EST LA TABLE festival_events.
// Tarifs : 3 000 FCFA par spectacle ; Gala 3 000 FCFA (normal) ou 15 000 FCFA (VIP).
// ⚠️ Jauge du village (300) provisoire, à confirmer.
export const BILLETS_SECOURS = [
  { slug: 'arret-de-bus-25', titre: 'Arrêt de bus', compagnie: 'Cie Dafra', date_label: 'Mer. 25 nov. · 17h15', lieu: 'Grande Salle · Maison des Jeunes d’Agla', prix_fcfa: 3000, places_restantes: 300 },
  { slug: 'basketteuses-25', titre: 'Basketteuses de Bamako', compagnie: 'Cie Thomas Guérineau', date_label: 'Mer. 25 nov. · 18h30', lieu: 'Institut français de Cotonou', prix_fcfa: 5000, places_restantes: 400 },
  { slug: 'astres-26', titre: 'Astres resplendissantes', compagnie: 'Cie All Circus', date_label: 'Jeu. 26 nov. · 19h30', lieu: 'Grande Salle · Maison des Jeunes d’Agla', prix_fcfa: 3000, places_restantes: 300 },
  { slug: 'souffle-26', titre: 'Souffle', compagnie: 'Cie Dafra', date_label: 'Jeu. 26 nov. · 20h30', lieu: 'Grande Salle · Maison des Jeunes d’Agla', prix_fcfa: 3000, places_restantes: 300 },
  { slug: 'jarre-sacre-27', titre: 'Jarre Sacré', compagnie: 'Cotonou Cirk Compagnie', date_label: 'Ven. 27 nov. · 21h00', lieu: 'Grande Salle · Maison des Jeunes d’Agla', prix_fcfa: 3000, places_restantes: 300 },
  { slug: 'arret-de-bus-27', titre: 'Arrêt de bus', compagnie: 'Cie Dafra', date_label: 'Ven. 27 nov. · 18h45', lieu: 'Grande Salle · Maison des Jeunes d’Agla', prix_fcfa: 3000, places_restantes: 300 },
  { slug: 'fabara-27', titre: 'Fabara', compagnie: 'Cie FABARA', date_label: 'Ven. 27 nov. · 18h00', lieu: 'Grande Salle · Maison des Jeunes d’Agla', prix_fcfa: 3000, places_restantes: 300 },
  { slug: 'pluie-28', titre: 'La pluie et le beau temps', compagnie: 'Loup Pinel', date_label: 'Sam. 28 nov. · 11h00', lieu: 'Grande Salle · Maison des Jeunes d’Agla', prix_fcfa: 3000, places_restantes: 300 },
  { slug: 'souffle-28', titre: 'Souffle', compagnie: 'Cie Dafra', date_label: 'Sam. 28 nov. · 14h30', lieu: 'Grande Salle · Maison des Jeunes d’Agla', prix_fcfa: 3000, places_restantes: 300 },
  { slug: 'fabara-28', titre: 'Fabara', compagnie: 'Cie FABARA', date_label: 'Sam. 28 nov. · 16h00', lieu: 'Grande Salle · Maison des Jeunes d’Agla', prix_fcfa: 3000, places_restantes: 300 },
  { slug: 'gala-show-28', titre: 'Gala · place normale', compagnie: null, date_label: 'Sam. 28 nov. · 20h00', lieu: 'Grande Salle · Maison des Jeunes d’Agla', prix_fcfa: 3000, places_restantes: 300 },
  { slug: 'gala-show-vip-28', titre: 'Gala · place VIP', compagnie: 'Remise de prix VIP', date_label: 'Sam. 28 nov. · 20h00', lieu: 'Grande Salle · Maison des Jeunes d’Agla', prix_fcfa: 15000, places_restantes: 50 },
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
      "Spectacles gratuits : La Roulotte (chaque jour), Les Monocyclistes d'Abomey et Acroforce de Parakou (jeu. et ven.)",
      'Spectacle Feu gratuit : mer. 20h30 et ven. 20h',
    ],
  },
  {
    titre: 'Soirées', couleur: 'pink',
    points: [
      'Mercredi 18h30 : Basketteuses de Bamako, à l’IFB (5 000 FCFA)',
      'Jeudi 19h30 Astres resplendissantes, 20h30 Souffle',
      'Vendredi 18h Fabara, 18h45 Arrêt de bus, 20h Spectacle Feu, 21h Jarre Sacré',
      'Samedi 20h : Gala et remise de prix',
      'Chaque soir : animation du village, en accès libre',
    ],
  },
  {
    titre: 'Professionnels', couleur: 'plum',
    points: [
      'Jeudi 15h : rencontres professionnelles au site de Circo Bénin (table ronde, speed-meetings, déjeuner de networking)',
      'Accréditation sur demande : circobenin@gmail.com',
    ],
  },
];

export const formatFcfa = (n) => `${new Intl.NumberFormat('fr-FR').format(n).replace(/ /g, ' ')} FCFA`;
