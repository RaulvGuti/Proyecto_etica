create table public.reportes (
  id bigint primary key generated always as identity,
  publicacion_id bigint not null references public.publicaciones(id) on delete cascade,
  reportado_por uuid references public.perfiles(id),
  motivo text not null check (char_length(motivo) <= 500),
  estado text not null default 'pendiente' check (estado in ('pendiente','revisado','descartado')),
  creado_en timestamptz not null default now()
);