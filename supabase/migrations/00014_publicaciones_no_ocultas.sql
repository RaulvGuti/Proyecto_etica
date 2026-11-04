-- 00014_publicaciones_no_ocultas.sql
-- Alinea la politica RLS con la regla publica: mostrar todo lo no oculto y no eliminado.

drop policy if exists "publicaciones: lectura publica de visibles" on public.publicaciones;
drop policy if exists "publicaciones: lectura publica no ocultas" on public.publicaciones;

create policy "publicaciones: lectura publica no ocultas"
  on public.publicaciones
  for select
  to anon, authenticated
  using (
    (estado <> 'oculto' and eliminado_en is null)
    or auth.uid() = autor_id
    or public.es_moderador()
  );
