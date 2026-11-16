// Route : /cirque-en-fusion-2026/billets?commande=<uuid>&cle=<uuid>
// FedaPay renvoie l'acheteur ici après le paiement. La page interroge la commande
// jusqu'à confirmation par le webhook, puis affiche un billet (QR code) par place.
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { supabase } from '../../supabase';
import { formatFcfa } from './festivalData';
import './cirque-en-fusion-2026.css';
import logoCef from './assets/logo-cef.webp';

function BilletQR({ code }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(code, { margin: 1, width: 220, color: { dark: '#14111C', light: '#FFFFFF' } }).then(setSrc);
  }, [code]);
  return src ? <img className="cef-tk-qr" src={src} alt={`QR code du billet ${code}`} width="132" height="132" /> : <div className="cef-qr-vide" />;
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
          fetch('/api/festival-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'verifier', commande, cle }),
          }).catch(() => {});
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
            {data.tickets.map((t, i) => {
              const vip = /vip/i.test(t.titre || '');
              const nom = [data.buyer_firstname, data.buyer_lastname].filter(Boolean).join(' ');
              return (
                <article key={t.code} className="cef-tk">
                  <div className="cef-tk-main">
                    <p className="cef-tk-kicker">Festival international des arts du cirque · 3ᵉ édition</p>
                    <p className="cef-tk-festival">CIRQUE EN FUSION 2026 · Cotonou</p>
                    <h3 className="cef-tk-titre">{t.titre}</h3>
                    <div className="cef-tk-infos">
                      <div className="cef-tk-date"><span>Date</span><strong>{t.date_label}</strong></div>
                      <div><span>Lieu</span><strong>{t.lieu}</strong></div>
                      {nom && <div><span>Au nom de</span><strong>{nom}</strong></div>}
                    </div>
                    <div className="cef-tk-bas">
                      <p className="cef-tk-theme">Rythmes et Corporalités</p>
                      {vip && <span className="cef-tk-vip">VIP</span>}
                    </div>
                  </div>
                  <div className="cef-tk-stub">
                    <img className="cef-tk-logo" src={logoCef} alt="Cirque en Fusion" />
                    <BilletQR code={t.code} />
                    <p className="cef-tk-code">{t.code}</p>
                    <p className="cef-tk-num">Billet {i + 1} / {data.tickets.length}</p>
                  </div>
                  <div className="cef-tk-pied">
                    <span><b>Admission unique</b> · QR code scanné à l'entrée · ne pas photocopier</span>
                    <span>circobenin.com · +229 01 52 76 33 33</span>
                  </div>
                </article>
              );
            })}
          </div>
          <button type="button" className="cef-btn cef-btn-dark" onClick={() => window.print()}>Imprimer mes billets</button>
        </>
      )}
    </div>
  );
}
