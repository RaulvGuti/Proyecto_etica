create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  alias text not null default 'Anónimo',
  rol text not null default 'usuario' check (rol in ('usuario','moderador','admin')),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on column public.perfiles.rol is 'usuario | moderador | admin — controla permisos vía RLS';
comment on column public.perfiles.activo is 'false = cuenta suspendida por moderación, sin borrar el historial';