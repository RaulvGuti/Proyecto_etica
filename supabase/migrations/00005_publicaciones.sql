create table public.publicaciones (
  id bigint primary key generated always as identity,
  autor_id uuid references public.perfiles(id) on delete set null,
  categoria_id smallint not null references public.categorias(id),
  alias_mostrado text not null,
  texto text not null check (char_length(texto) between 1 and 2000),
  anonimo boolean not null default false,
  estado text not null default 'visible' check (estado in ('visible','oculto','eliminado')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  eliminado_en timestamptz
);