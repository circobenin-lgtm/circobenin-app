// Outils FedaPay partagés par les fonctions de la billetterie
// Variables d'environnement (Supabase > Edge Functions > Secrets) :
//   FEDAPAY_SECRET_KEY      clé secrète (sk_sandbox_… pour tester, sk_live_… en production)
//   FEDAPAY_ENV             "sandbox" ou "live"
//   FEDAPAY_WEBHOOK_SECRET  secret du webhook (wh_…), pour vérifier les notifications
//   SITE_URL                https://app.circobenin.com
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const FEDAPAY_API =
  Deno.env.get('FEDAPAY_ENV') === 'live' ? 'https://api.fedapay.com/v1' : 'https://sandbox-api.fedapay.com/v1';

export const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://app.circobenin.com';

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export const admin = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

export async function fedapay(path: string, init: RequestInit = {}) {
  const res = await fetch(`${FEDAPAY_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${Deno.env.get('FEDAPAY_SECRET_KEY')}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`FedaPay ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

// Relit le statut réel de la transaction chez FedaPay et met la commande à jour.
export async function synchroniserCommande(sb: ReturnType<typeof admin>, orderId: string, transactionId: number) {
  const tx = await fedapay(`/transactions/${transactionId}`);
  const status: string = tx['v1/transaction']?.status;
  if (status === 'approved' || status === 'transferred') {
    const { error } = await sb.rpc('mark_festival_order_paid', { p_order_id: orderId });
    if (error) throw error;
    return 'paid';
  }
  if (status === 'declined') {
    await sb.from('festival_orders').update({ status: 'failed' }).eq('id', orderId).eq('status', 'pending');
    return 'failed';
  }
  if (status === 'canceled' || status === 'expired') {
    await sb.from('festival_orders').update({ status: 'cancelled' }).eq('id', orderId).eq('status', 'pending');
    return 'cancelled';
  }
  return 'pending';
}
