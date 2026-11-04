-- 00013_politicas_rls_publicas.sql
-- Politicas RLS explicitas para lectura publica anonima y grants de apoyo comunitario

alter table public.publicaciones enable row level security;
alter table public.organizaciones enable row level security;
alter table public.guias_salud enable row level security;
alter table public.categorias enable row level security;
alter table public.ciudades enable row level security;
alter table public.tipos_organizacion enable row level security;

drop policy if exists "publicaciones: lectura publica de visibles" on public.publicaciones;

create policy "publicaciones: lectura publica de visibles"
  on public.publicaciones
  for select
  to anon, authenticated
  using (
    (estado = 'visible' and eliminado_en is null)
    or auth.uid() = autor_id
    or public.es_moderador()
  );

drop policy if exists "organizaciones: lectura publica" on public.organizaciones;

create policy "organizaciones: lectura publica"
  on public.organizaciones
  for select
  to anon, authenticated
  using (eliminado_en is null);

drop policy if exists "guias_salud: lectura publica" on public.guias_salud;

create policy "guias_salud: lectura publica"
  on public.guias_salud
  for select
  to anon, authenticated
  using (eliminado_en is null);

drop policy if exists "categorias: lectura publica" on public.categorias;

create policy "categorias: lectura publica"
  on public.categorias
  for select
  to anon, authenticated
  using (true);

drop policy if exists "ciudades: lectura publica" on public.ciudades;

create policy "ciudades: lectura publica"
  on public.ciudades
  for select
  to anon, authenticated
  using (true);

drop policy if exists "tipos_organizacion: lectura publica" on public.tipos_organizacion;

create policy "tipos_organizacion: lectura publica"
  on public.tipos_organizacion
  for select
  to anon, authenticated
  using (true);

grant select on public.publicaciones to anon, authenticated;
grant select on public.organizaciones to anon, authenticated;
grant select on public.guias_salud to anon, authenticated;
grant select on public.categorias to anon, authenticated;
grant select on public.ciudades to anon, authenticated;
grant select on public.tipos_organizacion to anon, authenticated;

grant insert on public.publicaciones to anon, authenticated;
grant insert on public.organizaciones to anon, authenticated;
grant insert on public.reportes to anon, authenticated;
