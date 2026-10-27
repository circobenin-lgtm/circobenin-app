// Webhook FedaPay → confirme les paiements et génère les billets.
// À déployer SANS vérification JWT :  supabase functions deploy festival-fedapay-webhook --no-verify-jwt
// URL à déclarer dans le tableau de bord FedaPay (Webhooks) :
//   https://<projet>.supabase.co/functions/v1/festival-fedapay-webhook
// Événements : transaction.approved, transaction.declined, transaction.canceled
import { admin, json, synchroniserCommande } from '../_shared/fedapay.ts';

async function signatureValide(payload: string, entete: string | null) {
  const secret = Deno.env.get('FEDAPAY_WEBHOOK_SECRET');
  if (!secret) return true; // sans secret, on se fie uniquement à la relecture chez FedaPay ci-dessous
  if (!entete) return false;
  const parts = Object.fromEntries(entete.split(',').map((p) => p.trim().split('=')));
  if (!parts.t || !parts.s) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 600) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${parts.t}.${payload}`));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex === parts.s;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false }, 405);
  const payload = await req.text();
  if (!(await signatureValide(payload, req.headers.get('x-fedapay-signature')))) {
    return json({ ok: false, message: 'Signature invalide' }, 401);
  }

  let evt: any;
  try { evt = JSON.parse(payload); } catch { return json({ ok: false }, 400); }
  const txId = evt?.entity?.id;
  if (!txId) return json({ ok: true, ignore: true });

  const sb = admin();
  const { data: o } = await sb.from('festival_orders')
    .select('id').eq('fedapay_transaction_id', txId).maybeSingle();
  if (!o) return json({ ok: true, ignore: true }); // transaction d'un autre module de l'app (inscriptions, stages…)

  try {
    // On ne croit jamais le contenu du webhook : on relit le statut directement chez FedaPay
    const status = await synchroniserCommande(sb, o.id, txId);
    return json({ ok: true, status });
  } catch (e) {
    console.error(e);
    return json({ ok: false }, 500); // FedaPay réessaiera
  }
});
