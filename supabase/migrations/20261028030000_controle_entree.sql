-- Contrôle à l'entrée : valide un billet une seule fois (opération atomique, sans double entrée possible)
create or replace function public.checkin_festival_ticket(p_code text, p_event_slug text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  t record;
  v_maj int;
  v_quand timestamptz;
begin
  select tk.id, tk.scanned_at, e.slug, e.titre, e.date_label,
         o.buyer_firstname || ' ' || o.buyer_lastname as acheteur, o.status
    into t
    from public.festival_tickets tk
    join public.festival_events e on e.id = tk.event_id
    join public.festival_orders o on o.id = tk.order_id
   where tk.code = upper(trim(p_code));

  if not found then
    return jsonb_build_object('statut', 'inconnu');
  end if;
  if t.status <> 'paid' then
    return jsonb_build_object('statut', 'non_paye', 'titre', t.titre, 'date_label', t.date_label, 'acheteur', t.acheteur);
  end if;
  if coalesce(p_event_slug, '') <> '' and t.slug <> p_event_slug then
    return jsonb_build_object('statut', 'mauvais', 'titre', t.titre, 'date_label', t.date_label, 'acheteur', t.acheteur);
  end if;

  update public.festival_tickets set scanned_at = now() where id = t.id and scanned_at is null;
  get diagnostics v_maj = row_count;
  if v_maj = 0 then
    select scanned_at into v_quand from public.festival_tickets where id = t.id;
    return jsonb_build_object('statut', 'deja', 'titre', t.titre, 'date_label', t.date_label, 'acheteur', t.acheteur, 'scanned_at', v_quand);
  end if;

  return jsonb_build_object('statut', 'ok', 'titre', t.titre, 'date_label', t.date_label, 'acheteur', t.acheteur, 'slug', t.slug);
end $$;

revoke all on function public.checkin_festival_ticket(text, text) from public, anon, authenticated;
grant execute on function public.checkin_festival_ticket(text, text) to service_role;
