-- 00012_ajustes_seguridad_conexion.sql
-- Ajustes de seguridad RLS e índices para conexión comunitaria y administrativa plena

-- 1. PUBLICACIONES: Permitir inserción anónima / comunitaria directa desde /comunidad
-- Se reemplaza la política restrictiva de 00008_rls_policies.sql que requería auth.uid() obligatorio.
drop policy if exists "publicaciones: autenticado inserta" on public.publicaciones;

create policy "publicaciones: insercion comunitaria" on public.publicaciones
  for insert with check (
    (auth.uid() is null and autor_id is null and estado = 'visible')
    or
    (auth.uid() is not null and (autor_id is null or auth.uid() = autor_id))
  );

-- 2. ORGANIZACIONES: Permitir sugerencias ciudadanas sin verificación previa
-- Los aportes comunitarios ingresan con verificado = false para posterior revisión de moderación.
create policy "organizaciones: sugerencias comunitarias" on public.organizaciones
  for insert with check (verificado = false);

-- 3. ÍNDICES DE RENDIMIENTO: Acelerar búsquedas y filtros en directorio y publicaciones
create index if not exists idx_organizaciones_verificado
  on public.organizaciones (verificado)
  where eliminado_en is null;

create index if not exists idx_organizaciones_tipo
  on public.organizaciones (tipo_id)
  where eliminado_en is null;

