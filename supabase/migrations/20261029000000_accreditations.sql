-- Demandes d'accréditation (professionnels, presse, influenceurs) — Cirque en Fusion 2026
create table if not exists public.festival_accreditations (
  id           uuid primary key default gen_random_uuid(),
  festival     text not null default 'cef-2026',
  type         text not null check (type in ('professionnel', 'presse', 'influenceur')),
  prenom       text not null,
  nom          text not null,
  structure    text,
  fonction     text,
  email        text,
  telephone    text not null,
  ville        text,
  plateformes  text,
  lien         text,
  abonnes      text,
  jours        text,
  message      text,
  statut       text not null default 'nouvelle' check (statut in ('nouvelle', 'acceptee', 'refusee')),
  created_at   timestamptz not null default now()
);
-- Aucun accès public direct : seules les fonctions serveur (clé service) lisent et écrivent
alter table public.festival_accreditations enable row level security;
