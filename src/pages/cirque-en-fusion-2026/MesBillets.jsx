// Route : /cirque-en-fusion-2026/billets?commande=<uuid>&cle=<uuid>
// FedaPay renvoie l'acheteur ici après le paiement. La page interroge la commande
// jusqu'à confirmation par le webhook, puis affiche un billet (QR code) par place.
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { supabase } from '../../supabase';
import { formatFcfa } from './festivalData';
import './cirque-en-fusion-2026.css';

function BilletQR({ code }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(code, { margin: 1, width: 220, color: { dark: '#14111C', light: '#FFFFFF' } }).then(setSrc);
  }, [code]);
  return src ? <img src={src} alt={`QR code du billet ${code}`} width="160" height="160" /> : <div className="cef-qr-vide" />;
}

export default function MesBillets() {
  const params = new URLSearchParams(window.location.search);
  const commande = params.get('commande');
  const cle = params.get('cle');
  const [etat, setEtat] = useState({ chargement: true, data: null, erreur: '' });

  useEffect(() => {
    if (!commande || !cle) {
      setEtat({ chargement: false, data: null, erreur: 'Lien de commande incomplet.' });
      return undefined;
    }
    let essais = 0;
    let minuteur;
    const charger = async () => {
      const { data, error } = await supabase.rpc('get_festival_order', { p_order_id: commande, p_access_key: cle });
      if (error || !data) {
        setEtat({ chargement: false, data: null, erreur: 'Commande introuvable.' });
        return;
      }
      setEtat({ chargement: false, data, erreur: '' });
      // le webhook FedaPay peut arriver quelques secondes après le retour de l'acheteur :
      // on redemande aussi le statut directement à FedaPay
      if (data.status === 'pending' && essais < 20) {
        if (essais % 2 === 0) {
          supabase.functions.invoke('festival-checkout', { body: { action: 'verifier', commande, cle } });
        }
        essais += 1;
        minuteur = setTimeout(charger, 3000);
      }
    };
    charger();
    return () => clearTimeout(minuteur);
  }, [commande, cle]);

  const { chargement, data, erreur } = etat;

  return (
    <div className="cef-page cef-mes-billets">
      <header className="cef-mb-header">
        <a href="/cirque-en-fusion-2026" className="cef-retour">← Cirque en Fusion 2026</a>
        <h1>Mes billets</h1>
      </header>

      {chargement && <p className="cef-statut">Chargement de votre commande…</p>}
      {erreur && <p className="cef-statut cef-erreur">{erreur} Écrivez-nous à circobenin@gmail.com avec votre numéro de téléphone.</p>}

      {data?.status === 'pending' && (
        <div className="cef-statut cef-statut-attente">
          <strong>Paiement en cours de confirmation…</strong>
          <p>Gardez cette page ouverte, vos billets apparaîtront automatiquement.</p>
        </div>
      )}
      {(data?.status === 'cancelled' || data?.status === 'failed') && (
        <div className="cef-statut cef-erreur">
          <strong>Le paiement n'a pas abouti.</strong>
          <p>Aucun montant n'a été débité pour cette commande. <a href="/cirque-en-fusion-2026#billetterie">Recommencer</a></p>
        </div>
      )}

      {data?.status === 'paid' && (
        <>
          <div className="cef-statut cef-statut-ok">
            <strong>Merci {data.buyer_firstname} ! Paiement confirmé · {formatFcfa(data.total_fcfa)}</strong>
            <p>Présentez chaque QR code à l'entrée (sur votre téléphone ou imprimé). Une place = un QR code.</p>
          </div>
          <div className="cef-tickets">
            {data.tickets.map((t) => (
              <article key={t.code} className="cef-ticket">
                <div className="cef-ticket-txt">
                  <p className="cef-ticket-kicker">Cirque en Fusion · 3ᵉ édition</p>
                  <h3>{t.titre}</h3>
                  <p>{t.date_label}</p>
                  <p>{t.lieu}</p>
                  <p className="cef-ticket-code">{t.code}</p>
                </div>
                <BilletQR code={t.code} />
              </article>
            ))}
          </div>
          <button type="button" className="cef-btn cef-btn-dark" onClick={() => window.print()}>Imprimer mes billets</button>
        </>
      )}
    </div>
  );
}
