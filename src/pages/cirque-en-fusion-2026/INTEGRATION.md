# Cirque en Fusion 2026 — intégration dans app.circobenin.com

## 1. Copier les fichiers dans le dépôt `circobenin-app`
- `src/pages/cirque-en-fusion-2026/` → même chemin dans l'app (page, billetterie, plan, CSS, photos)
- `supabase/migrations/…_cirque_en_fusion_billetterie.sql`
- `supabase/functions/_shared/fedapay.ts`, `festival-checkout/`, `festival-fedapay-webhook/`

Dans `Billetterie.jsx` et `MesBillets.jsx`, adapter la ligne
`import { supabase } from '../../lib/supabaseClient';` au chemin réel du client Supabase de l'app.

## 2. Dépendance
```bash
npm install qrcode
```

## 3. Routes (react-router)
```jsx
import CirqueEnFusion2026 from './pages/cirque-en-fusion-2026/CirqueEnFusion2026';
import MesBillets from './pages/cirque-en-fusion-2026/MesBillets';

<Route path="/cirque-en-fusion-2026" element={<CirqueEnFusion2026 />} />
<Route path="/cirque-en-fusion-2026/billets" element={<MesBillets />} />
```
Ajouter un lien « Cirque en Fusion 2026 » dans le menu principal de l'app.
Ces deux routes doivent rester **publiques** (hors de toute protection de connexion).

## 4. Base de données
Supabase → SQL Editor → coller et exécuter la migration (ou `supabase db push`).
**Avant d'ouvrir les ventes**, mettre les vrais tarifs et jauges dans la table `festival_events`
(Table editor). Mettre `en_vente = false` pour retirer un spectacle de la vente.

## 5. Fonctions et FedaPay
Secrets (Supabase → Edge Functions → Secrets) :
`FEDAPAY_SECRET_KEY`, `FEDAPAY_ENV` (`sandbox` pour tester, puis `live`), `FEDAPAY_WEBHOOK_SECRET`, `SITE_URL=https://app.circobenin.com`

```bash
supabase functions deploy festival-checkout
supabase functions deploy festival-fedapay-webhook --no-verify-jwt
```
Dans le tableau de bord FedaPay → Webhooks : ajouter
`https://<projet>.supabase.co/functions/v1/festival-fedapay-webhook`
(événements `transaction.approved`, `transaction.declined`, `transaction.canceled`).

## 6. Tester en sandbox avant le passage en live
Acheter un billet avec un numéro de test FedaPay, vérifier que la page « Mes billets » affiche les QR codes,
puis passer `FEDAPAY_ENV=live` avec la clé live.

## Fonctionnement
- Les places sont bloquées 30 min pendant le paiement, puis libérées si le paiement n'aboutit pas.
- 1 place = 1 billet = 1 QR code (`CEF26-XXXXXXXXXX`), stocké dans `festival_tickets` (colonne `scanned_at` prévue pour le contrôle à l'entrée).
- Liste des ventes : table `festival_orders` filtrée sur `status = 'paid'`.
