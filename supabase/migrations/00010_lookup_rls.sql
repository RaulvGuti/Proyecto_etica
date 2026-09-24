alter table public.categorias enable row level security;
alter table public.ciudades enable row level security;
alter table public.tipos_organizacion enable row level security;

create policy "categorias: lectura publica" on public.categorias for select using (true);
create policy "ciudades: lectura publica" on public.ciudades for select using (true);
create policy "tipos_organizacion: lectura publica" on public.tipos_organizacion for select using (true);