create table public.organizaciones (
  id bigint primary key generated always as identity,
  nombre text not null,
  ciudad_id smallint not null references public.ciudades(id),
  tipo_id smallint not null references public.tipos_organizacion(id),
  telefono text,
  sitio_web text,
  nota text,
  verificado boolean not null default false,
  creado_por uuid references public.perfiles(id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  eliminado_en timestamptz
);