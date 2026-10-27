import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Pages publiques du festival Cirque en Fusion 2026 (chargées uniquement à ces adresses)
const CirqueEnFusion2026 = React.lazy(() => import('./pages/cirque-en-fusion-2026/CirqueEnFusion2026'));
const MesBilletsCEF = React.lazy(() => import('./pages/cirque-en-fusion-2026/MesBillets'));
const chemin = window.location.pathname.replace(/\/+$/, '');
const Page = chemin === '/cirque-en-fusion-2026/billets' ? MesBilletsCEF
  : chemin === '/cirque-en-fusion-2026' ? CirqueEnFusion2026 : App;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><React.Suspense fallback={null}><Page /></React.Suspense></React.StrictMode>);
