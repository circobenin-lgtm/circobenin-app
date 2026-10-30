// Route : /cirque-en-fusion-2026/controle — contrôle des billets à l'entrée (téléphone du portier)
import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import './controle-entree.css';

const CLE_CODE = 'cef_code_controle';
const CLE_SPECTACLE = 'cef_spectacle_controle';
const lire = (k) => { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } };
const ecrire = (k, v) => { try { if (v) sessionStorage.setItem(k, v); else sessionStorage.removeItem(k); } catch (e) { /* ignore */ } };

const appelApi = async (body) => {
  const rep = await fetch('/api/festival-controle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await rep.json().catch(() => ({}));
  return { rep, data };
};

// petit bip (aigu = entrée valide, grave = refus)
const bip = (ok) => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = ok ? 1046 : 220;
    o.type = ok ? 'sine' : 'square';
    g.gain.value = 0.15;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + (ok ? 0.15 : 0.45));
  } catch (e) { /* ignore */ }
  try { if (!ok && navigator.vibrate) navigator.vibrate([200, 80, 200]); } catch (e) { /* ignore */ }
};

const RESULTATS = {
  ok: { classe: 'ok', titre: 'ENTRÉE VALIDE', icone: '✓' },
  deja: { classe: 'ko', titre: 'DÉJÀ UTILISÉ', icone: '✕' },
  mauvais: { classe: 'attention', titre: 'MAUVAIS SPECTACLE', icone: '!' },
  inconnu: { classe: 'ko', titre: 'BILLET INCONNU', icone: '✕' },
  non_paye: { classe: 'ko', titre: 'BILLET NON PAYÉ', icone: '✕' },
  erreur: { classe: 'attention', titre: 'ERREUR RÉSEAU', icone: '!' },
};

export default function ControleEntree() {
  const [code, setCode] = useState(() => lire(CLE_CODE));
  const [saisie, setSaisie] = useState('');
  const [erreurCode, setErreurCode] = useState('');
  const [evenements, setEvenements] = useState(null);
  const [spectacle, setSpectacle] = useState(() => lire(CLE_SPECTACLE));
  const [resultat, setResultat] = useState(null);
  const [cameraErreur, setCameraErreur] = useState('');
  const [manuel, setManuel] = useState('');
  const [enCours, setEnCours] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fluxRef = useRef(null);
  const occupeRef = useRef(false);
  const dernierRef = useRef({ code: '', t: 0 });
  const minuteurRef = useRef(null);

  useEffect(() => {
    document.title = 'Contrôle entrée · Cirque en Fusion';
  }, []);

  // ── Connexion avec le code ──
  const chargerEvenements = useCallback(async (c) => {
    setErreurCode('');
    try {
      const { rep, data } = await appelApi({ code: c, action: 'evenements' });
      if (rep.status === 401) { ecrire(CLE_CODE, ''); setCode(''); setErreurCode('Code incorrect'); return; }
      if (!rep.ok) { setErreurCode(data.message || 'Erreur'); return; }
      ecrire(CLE_CODE, c);
      setCode(c);
      setEvenements(data.evenements);
    } catch (e) {
      setErreurCode('Connexion impossible. Vérifiez internet.');
    }
  }, []);

  useEffect(() => {
    if (code && !evenements) chargerEvenements(code);
  }, [code, evenements, chargerEvenements]);

  // ── Vérification d'un billet ──
  const verifier = useCallback(async (billet) => {
    if (occupeRef.current) return;
    const maintenant = Date.now();
    if (dernierRef.current.code === billet && maintenant - dernierRef.current.t < 8000) return;
    dernierRef.current = { code: billet, t: maintenant };
    occupeRef.current = true;
    setEnCours(true);
    let res;
    try {
      const { rep, data } = await appelApi({ code, action: 'scanner', billet, spectacle });
      if (rep.status === 401) { ecrire(CLE_CODE, ''); setCode(''); occupeRef.current = false; setEnCours(false); return; }
      res = rep.ok ? data : { statut: 'erreur', message: data.message };
      if (data.compteur) {
        setEvenements((evs) => (evs || []).map((e) => (e.slug === data.compteur.slug ? data.compteur : e)));
      }
    } catch (e) {
      res = { statut: 'erreur', message: 'Pas de connexion internet.' };
    }
    bip(res.statut === 'ok');
    setResultat(res);
    setEnCours(false);
    clearTimeout(minuteurRef.current);
    minuteurRef.current = setTimeout(() => { setResultat(null); occupeRef.current = false; }, res.statut === 'ok' ? 2500 : 5000);
  }, [code, spectacle]);

  const fermerResultat = () => {
    clearTimeout(minuteurRef.current);
    setResultat(null);
    occupeRef.current = false;
  };

  // ── Caméra + lecture des QR codes ──
  const pret = Boolean(code && evenements && spectacle);
  useEffect(() => {
    if (!pret) return undefined;
    let actif = true;
    let raf = 0;
    let dernierScan = 0;
    setCameraErreur('');

    const boucle = (t) => {
      if (!actif) return;
      raf = requestAnimationFrame(boucle);
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v || !c || v.readyState < 2 || occupeRef.current || t - dernierScan < 180) return;
      dernierScan = t;
      const l = Math.min(640, v.videoWidth);
      const h = Math.round((v.videoHeight / v.videoWidth) * l) || 0;
      if (!l || !h) return;
      c.width = l; c.height = h;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(v, 0, 0, l, h);
      const img = ctx.getImageData(0, 0, l, h);
      const qr = jsQR(img.data, l, h, { inversionAttempts: 'dontInvert' });
      if (qr && qr.data) verifier(qr.data.trim());
    };

    navigator.mediaDevices?.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((flux) => {
        if (!actif) { flux.getTracks().forEach((tr) => tr.stop()); return; }
        fluxRef.current = flux;
        const v = videoRef.current;
        v.srcObject = flux;
        v.setAttribute('playsinline', 'true');
        v.play().catch(() => {});
        raf = requestAnimationFrame(boucle);
      })
      .catch(() => setCameraErreur("Caméra inaccessible. Autorisez la caméra pour ce site dans les réglages du navigateur, ou tapez le code du billet ci-dessous."));
    if (!navigator.mediaDevices) setCameraErreur('Ce navigateur ne permet pas la caméra. Tapez le code du billet ci-dessous.');

    return () => {
      actif = false;
      cancelAnimationFrame(raf);
      if (fluxRef.current) fluxRef.current.getTracks().forEach((tr) => tr.stop());
      fluxRef.current = null;
    };
  }, [pret, verifier]);

  // ── Écran : code ──
  if (!code || !evenements) {
    return (
      <div className="ce-page ce-centre">
        <div className="ce-carte">
          <p className="ce-kicker">Cirque en Fusion 2026</p>
          <h1>Contrôle à l'entrée</h1>
          <p className="ce-muted">Tapez le code de contrôle fourni par la direction.</p>
          <input
            type="password" value={saisie} placeholder="Code de contrôle" autoFocus
            onChange={(e) => { setSaisie(e.target.value); setErreurCode(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && saisie) chargerEvenements(saisie); }}
          />
          {erreurCode && <p className="ce-erreur">{erreurCode}</p>}
          <button type="button" className="ce-btn" disabled={!saisie} onClick={() => chargerEvenements(saisie)}>
            {code && !evenements && !erreurCode ? 'Chargement…' : 'Commencer'}
          </button>
        </div>
      </div>
    );
  }

  // ── Écran : choix du spectacle ──
  if (!spectacle) {
    return (
      <div className="ce-page">
        <header className="ce-tete">
          <div>
            <p className="ce-kicker">Contrôle à l'entrée</p>
            <h1>Quel spectacle contrôlez-vous ?</h1>
          </div>
        </header>
        <div className="ce-liste">
          {evenements.map((e) => (
            <button key={e.slug} type="button" className="ce-choix" onClick={() => { setSpectacle(e.slug); ecrire(CLE_SPECTACLE, e.slug); }}>
              <span className="ce-choix-date">{e.date_label}</span>
              <strong>{e.titre}</strong>
              <span className="ce-muted">{e.entres} entrés / {e.vendus} billets vendus</span>
            </button>
          ))}
        </div>
        <button type="button" className="ce-lien" onClick={() => { ecrire(CLE_CODE, ''); setCode(''); setEvenements(null); }}>Se déconnecter</button>
        <a className="ce-lien" href="/">← Retour à l'app Circo Bénin</a>
      </div>
    );
  }

  // ── Écran : scanner ──
  const ev = evenements.find((e) => e.slug === spectacle) || {};
  const r = resultat ? RESULTATS[resultat.statut] || RESULTATS.erreur : null;
  return (
    <div className="ce-page ce-scan">
      <header className="ce-tete">
        <div>
          <p className="ce-kicker">{ev.date_label}</p>
          <h1>{ev.titre}</h1>
        </div>
        <div className="ce-compteur">
          <strong>{ev.entres || 0}</strong>
          <span>/ {ev.vendus || 0} entrés</span>
        </div>
      </header>

      <div className="ce-video">
        <video ref={videoRef} muted playsInline autoPlay />
        <canvas ref={canvasRef} hidden />
        <div className="ce-viseur" />
        {enCours && <div className="ce-verif">Vérification…</div>}
        {cameraErreur && <div className="ce-camera-erreur">{cameraErreur}</div>}
      </div>

      <form className="ce-manuel" onSubmit={(e) => { e.preventDefault(); if (manuel.trim()) { verifier(manuel.trim()); setManuel(''); } }}>
        <input value={manuel} onChange={(e) => setManuel(e.target.value)} placeholder="Code du billet" autoCapitalize="characters" />
        <button type="submit" className="ce-btn">OK</button>
      </form>

      <button type="button" className="ce-lien" onClick={() => { setSpectacle(''); ecrire(CLE_SPECTACLE, ''); }}>← Changer de spectacle</button>

      {r && (
        <div className={`ce-resultat ce-${r.classe}`} onClick={fermerResultat} role="alert">
          <div className="ce-icone">{r.icone}</div>
          <div className="ce-res-titre">{r.titre}</div>
          {resultat.acheteur && <div className="ce-res-nom">{resultat.acheteur}</div>}
          {resultat.statut === 'mauvais' && <div className="ce-res-detail">Ce billet est pour : <strong>{resultat.titre}</strong><br />{resultat.date_label}</div>}
          {resultat.statut === 'deja' && resultat.scanned_at && (
            <div className="ce-res-detail">Déjà entré à {new Date(resultat.scanned_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
          )}
          {resultat.statut === 'erreur' && <div className="ce-res-detail">{resultat.message || 'Réessayez.'}</div>}
          {resultat.billet && <div className="ce-res-code">{resultat.billet}</div>}
          <div className="ce-res-aide">Touchez l'écran pour continuer</div>
        </div>
      )}
    </div>
  );
}
