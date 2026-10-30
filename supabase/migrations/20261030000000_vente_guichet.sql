-- Ventes de billets sur place (espèces / Mobile Money direct) — Cirque en Fusion 2026
alter table public.festival_orders add column if not exists mode_paiement text not null default 'fedapay';
alter table public.festival_orders add column if not exists vendu_par text;
