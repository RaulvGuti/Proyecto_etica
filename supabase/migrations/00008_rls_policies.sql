alter table public.perfiles enable row level security;
alter table public.organizaciones enable row level security;
alter table public.publicaciones enable row level security;
alter table public.reportes enable row level security;

-- función helper: ¿el usuario actual es moderador o admin?
create or replace function public.es_moderador()
returns boolean as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol in ('moderador','admin')
  );
$$ language sql stable security definer;

-- PERFILES
create policy "perfiles: lectura publica" on public.perfiles for select using (true);
create policy "perfiles: solo dueño actualiza" on public.perfiles for update using (auth.uid() = id);

-- ORGANIZACIONES
create policy "organizaciones: lectura publica" on public.organizaciones
  for select using (eliminado_en is null);
create policy "organizaciones: solo moderadores insertan" on public.organizaciones
  for insert with check (public.es_moderador());
create policy "organizaciones: solo moderadores actualizan" on public.organizaciones
  for update using (public.es_moderador());

-- PUBLICACIONES
create policy "publicaciones: lectura publica de visibles" on public.publicaciones
  for select using (estado = 'visible' or auth.uid() = autor_id or public.es_moderador());
create policy "publicaciones: autenticado inserta" on public.publicaciones
  for insert with check (auth.uid() is not null and auth.uid() = autor_id);
create policy "publicaciones: dueño o moderador actualiza" on public.publicaciones
  for update using (auth.uid() = autor_id or public.es_moderador());

-- REPORTES
create policy "reportes: cualquiera inserta" on public.reportes for insert with check (true);
create policy "reportes: solo moderadores leen" on public.reportes for select using (public.es_moderador());
create policy "reportes: solo moderadores actualizan" on public.reportes for update using (public.es_moderador());