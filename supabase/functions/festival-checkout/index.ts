// POST { festival, items:[{slug, quantite}], acheteur:{prenom, nom, telephone, email} }
//   → crée la commande (places réservées 30 min) + la transaction FedaPay, renvoie { url }
// POST { action: "verifier", commande, cle }
//   → relit le statut chez FedaPay (filet de sécurité si le webhook tarde), renvoie { status }
import { admin, cors, fedapay, json, SITE_URL, synchroniserCommande } from '../_shared/fedapay.ts';

const nettoyerTel = (t: string) => {
  let d = String(t ?? '').replace(/\D/g, '');
  if (d.startsWith('229') && d.length > 10) d = d.slice(3);
  return d;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ message: 'Méthode non autorisée' }, 405);

  const sb = admin();
  let body: any;
  try { body = await req.json(); } catch { return json({ message: 'Requête invalide' }, 400); }

  // --- Vérification d'une commande existante ---
  if (body.action === 'verifier') {
    const { data: o } = await sb.from('festival_orders')
      .select('id, status, fedapay_transaction_id')
      .eq('id', body.commande).eq('access_key', body.cle).maybeSingle();
    if (!o) return json({ message: 'Commande introuvable' }, 404);
    if (o.status !== 'pending' || !o.fedapay_transaction_id) return json({ status: o.status });
    try {
      return json({ status: await synchroniserCommande(sb, o.id, o.fedapay_transaction_id) });
    } catch (e) {
      console.error(e);
      return json({ status: 'pending' });
    }
  }

  // --- Nouvelle commande ---
  const a = body.acheteur ?? {};
  const prenom = String(a.prenom ?? '').trim().slice(0, 80);
  const nom = String(a.nom ?? '').trim().slice(0, 80);
  const telephone = nettoyerTel(a.telephone);
  const email = a.email ? String(a.email).trim().slice(0, 160) : null;
  if (!prenom || !nom || telephone.length < 8) return json({ message: 'Nom, prénom et téléphone sont obligatoires.' }, 400);
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 10) return json({ message: 'Panier invalide.' }, 400);

  const { data: cmd, error } = await sb.rpc('create_festival_order', {
    p_festival: body.festival ?? 'cef-2026',
    p_items: body.items.map((i: any) => ({ slug: String(i.slug), quantite: Number(i.quantite) })),
    p_firstname: prenom, p_lastname: nom, p_phone: telephone, p_email: email,
  });
  if (error) { console.error(error); return json({ message: 'Erreur lors de la commande. Réessayez.' }, 500); }
  if (cmd.error) return json({ message: cmd.error }, 409);

  const retour = `${SITE_URL}/cirque-en-fusion-2026/billets?commande=${cmd.order_id}&cle=${cmd.access_key}`;

  try {
    const customer: Record<string, unknown> = {
      firstname: prenom, lastname: nom,
      phone_number: { number: telephone, country: 'bj' },
    };
    if (email) customer.email = email;

    const created = await fedapay('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        description: cmd.description.slice(0, 250),
        amount: cmd.total_fcfa,
        currency: { iso: 'XOF' },
        callback_url: retour,
        customer,
        custom_metadata: { order_id: cmd.order_id, festival: 'cef-2026' },
      }),
    });
    const txId = created['v1/transaction']?.id;
    const tok = await fedapay(`/transactions/${txId}/token`, { method: 'POST' });

    await sb.from('festival_orders').update({ fedapay_transaction_id: txId }).eq('id', cmd.order_id);
    return json({ url: tok.url, commande: cmd.order_id });
  } catch (e) {
    console.error(e);
    await sb.from('festival_orders').update({ status: 'failed' }).eq('id', cmd.order_id);
    return json({ message: "Le service de paiement ne répond pas. Réessayez dans quelques minutes." }, 502);
  }
});
