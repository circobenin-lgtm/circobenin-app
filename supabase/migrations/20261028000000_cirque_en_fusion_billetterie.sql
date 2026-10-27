-- Billetterie Cirque en Fusion 2026
-- Tables : spectacles en vente, commandes, lignes de commande, billets (1 billet = 1 place = 1 QR code)

create table if not exists public.festival_events (
  id          uuid primary key default gen_random_uuid(),
  festival    text not null,
  slug        text not null unique,
  titre       text not null,
  compagnie   text,
  date_label  text not null,
  lieu        text not null,
  starts_at   timestamptz not null,
  prix_fcfa   integer not null check (prix_fcfa > 0),
  capacite    integer not null check (capacite >= 0),
  en_vente    boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.festival_orders (
  id                      uuid primary key default gen_random_uuid(),
  festival                text not null,
  access_key              uuid not null default gen_random_uuid(),
  buyer_firstname         text not null,
  buyer_lastname          text not null,
  buyer_phone             text not null,
  buyer_email             text,
  total_fcfa              integer not null check (total_fcfa > 0),
  status                  text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'failed')),
  fedapay_transaction_id  bigint unique,
  expires_at              timestamptz not null default now() + interval '30 minutes',
  paid_at                 timestamptz,
  created_at              timestamptz not null default now()
);

create table if not exists public.festival_order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.festival_orders(id) on delete cascade,
  event_id       uuid not null references public.festival_events(id),
  quantite       integer not null check (quantite between 1 and 10),
  prix_unitaire  integer not null
);

create table if not exists public.festival_tickets (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.festival_orders(id) on delete cascade,
  event_id    uuid not null references public.festival_events(id),
  code        text not null unique,
  scanned_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists festival_order_items_event_idx on public.festival_order_items(event_id);
create index if not exists festival_orders_status_idx on public.festival_orders(status, expires_at);
create index if not exists festival_tickets_order_idx on public.festival_tickets(order_id);

-- RLS : le public ne lit que les spectacles en vente ; commandes et billets passent par des fonctions sécurisées
alter table public.festival_events      enable row level security;
alter table public.festival_orders      enable row level security;
alter table public.festival_order_items enable row level security;
alter table public.festival_tickets     enable row level security;

drop policy if exists "festival_events lecture publique" on public.festival_events;
create policy "festival_events lecture publique" on public.festival_events
  for select to anon, authenticated using (en_vente);

-- Places restantes = jauge − places payées − places en attente de paiement non expirées
create or replace view public.festival_event_availability as
select
  e.festival, e.slug, e.titre, e.compagnie, e.date_label, e.lieu, e.starts_at, e.prix_fcfa,
  greatest(e.capacite - coalesce((
    select sum(i.quantite)
    from public.festival_order_items i
    join public.festival_orders o on o.id = i.order_id
    where i.event_id = e.id
      and (o.status = 'paid' or (o.status = 'pending' and o.expires_at > now()))
  ), 0), 0)::int as places_restantes
from public.festival_events e
where e.en_vente;

grant select on public.festival_event_availability to anon, authenticated;

-- Création de commande : verrouille les spectacles concernés pour éviter la survente
create or replace function public.create_festival_order(
  p_festival text, p_items jsonb, p_firstname text, p_lastname text, p_phone text, p_email text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_item       jsonb;
  v_event      public.festival_events;
  v_qty        int;
  v_dispo      int;
  v_total      int := 0;
  v_order      public.festival_orders;
  v_titres     text[] := '{}';
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('error', 'Panier vide.');
  end if;

  -- verrou dans un ordre stable
  perform 1 from public.festival_events
   where festival = p_festival
     and slug in (select x->>'slug' from jsonb_array_elements(p_items) x)
   order by id for update;

  insert into public.festival_orders (festival, buyer_firstname, buyer_lastname, buyer_phone, buyer_email, total_fcfa)
  values (p_festival, p_firstname, p_lastname, p_phone, nullif(p_email, ''), 1)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantite')::int;
    if v_qty is null or v_qty < 1 or v_qty > 10 then
      raise exception 'quantite_invalide';
    end if;

    select * into v_event from public.festival_events
     where festival = p_festival and slug = v_item->>'slug' and en_vente;
    if not found then
      raise exception 'spectacle_introuvable';
    end if;

    select places_restantes into v_dispo from public.festival_event_availability where slug = v_event.slug;
    if v_dispo < v_qty then
      raise exception 'complet:%', v_event.titre;
    end if;

    insert into public.festival_order_items (order_id, event_id, quantite, prix_unitaire)
    values (v_order.id, v_event.id, v_qty, v_event.prix_fcfa);

    v_total  := v_total + v_qty * v_event.prix_fcfa;
    v_titres := v_titres || (v_qty || ' × ' || v_event.titre);
  end loop;

  update public.festival_orders set total_fcfa = v_total where id = v_order.id;

  return jsonb_build_object(
    'order_id', v_order.id,
    'access_key', v_order.access_key,
    'total_fcfa', v_total,
    'description', 'Cirque en Fusion 2026 – ' || array_to_string(v_titres, ', ')
  );
exception
  when others then
    if sqlerrm like 'complet:%' then
      return jsonb_build_object('error', 'Plus assez de places pour ' || substr(sqlerrm, 9) || '.');
    elsif sqlerrm in ('quantite_invalide', 'spectacle_introuvable') then
      return jsonb_build_object('error', 'Commande invalide, rechargez la page.');
    end if;
    raise;
end $$;

-- Paiement confirmé : génère un billet par place (idempotent)
create or replace function public.mark_festival_order_paid(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_status text;
  v_item   public.festival_order_items;
begin
  select status into v_status from public.festival_orders where id = p_order_id for update;
  if v_status is null or v_status = 'paid' then
    return;
  end if;

  update public.festival_orders set status = 'paid', paid_at = now() where id = p_order_id;

  for v_item in select * from public.festival_order_items where order_id = p_order_id loop
    insert into public.festival_tickets (order_id, event_id, code)
    select p_order_id, v_item.event_id,
           'CEF26-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
    from generate_series(1, v_item.quantite);
  end loop;
end $$;

-- Lecture d'une commande par l'acheteur (lien privé reçu après paiement)
create or replace function public.get_festival_order(p_order_id uuid, p_access_key uuid) returns jsonb
language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
    'status', o.status,
    'buyer_firstname', o.buyer_firstname,
    'total_fcfa', o.total_fcfa,
    'tickets', coalesce((
      select jsonb_agg(jsonb_build_object('code', t.code, 'titre', e.titre, 'date_label', e.date_label, 'lieu', e.lieu)
                       order by e.starts_at, t.code)
      from public.festival_tickets t join public.festival_events e on e.id = t.event_id
      where t.order_id = o.id), '[]'::jsonb)
  )
  from public.festival_orders o
  where o.id = p_order_id and o.access_key = p_access_key;
$$;

revoke all on function public.create_festival_order(text, jsonb, text, text, text, text) from public, anon, authenticated;
revoke all on function public.mark_festival_order_paid(uuid) from public, anon, authenticated;
grant execute on function public.create_festival_order(text, jsonb, text, text, text, text) to service_role;
grant execute on function public.mark_festival_order_paid(uuid) to service_role;
grant execute on function public.get_festival_order(uuid, uuid) to anon, authenticated;

-- Spectacles payants de l'édition 2026 : 3 000 FCFA ; Gala Show 3 000 FCFA (normal) ou 15 000 FCFA (VIP)
-- ⚠️ Jauges du village (300) et du VIP (50) provisoires : à ajuster dans Supabase > Table editor > festival_events
insert into public.festival_events (festival, slug, titre, compagnie, date_label, lieu, starts_at, prix_fcfa, capacite) values
  ('cef-2026', 'basketteuses-25',  'Basketteuses de Bamako',    'Cie Thomas Guérineau',   'Mer. 25 nov. · 20h00', 'Institut français de Cotonou', '2026-11-25 20:00+01', 3000, 400),
  ('cef-2026', 'jarre-sacre-26',   'Jarre Sacré',               'Cotonou Cirk Compagnie', 'Jeu. 26 nov. · 19h30', 'Village du festival, Agla',    '2026-11-26 19:30+01', 3000, 300),
  ('cef-2026', 'souffle-26',       'Souffle',                   'Cie Dafra',              'Jeu. 26 nov. · 20h30', 'Village du festival, Agla',    '2026-11-26 20:30+01', 3000, 300),
  ('cef-2026', 'fabara-27',        'Fabara',                    'Cie FABARA',             'Ven. 27 nov. · 18h00', 'Village du festival, Agla',    '2026-11-27 18:00+01', 3000, 300),
  ('cef-2026', 'gala-feu-27',      'Gala Feu',                  null,                     'Ven. 27 nov. · 20h30', 'Village du festival, Agla',    '2026-11-27 20:30+01', 3000, 300),
  ('cef-2026', 'gala-show-28',     'Gala Show · place normale', null,                     'Sam. 28 nov. · 20h00', 'Village du festival, Agla',    '2026-11-28 20:00+01', 3000, 300),
  ('cef-2026', 'gala-show-vip-28', 'Gala Show · place VIP',     'Remise de prix VIP',     'Sam. 28 nov. · 20h00', 'Village du festival, Agla',    '2026-11-28 20:00:01+01', 15000, 50)
on conflict (slug) do update set titre = excluded.titre, compagnie = excluded.compagnie, prix_fcfa = excluded.prix_fcfa;
