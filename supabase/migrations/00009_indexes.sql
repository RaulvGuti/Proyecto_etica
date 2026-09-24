-- Feed del foro ordenado por fecha (la consulta más frecuente)
create index idx_publicaciones_creado_en on public.publicaciones (creado_en desc) where estado = 'visible';

-- Filtro por categoría en el foro
create index idx_publicaciones_categoria on public.publicaciones (categoria_id);

-- Búsqueda de texto en publicaciones (ILIKE '%algo%' rápido)
create index idx_publicaciones_texto_trgm on public.publicaciones using gin (texto gin_trgm_ops);

-- Directorio filtrado por ciudad
create index idx_organizaciones_ciudad on public.organizaciones (ciudad_id) where eliminado_en is null;

-- Reportes pendientes (lo que ve el moderador primero)
create index idx_reportes_pendientes on public.reportes (creado_en) where estado = 'pendiente';