insert into public.ciudades (nombre, departamento) values
  ('Ciudad de Guatemala','Guatemala'),
  ('Quetzaltenango','Quetzaltenango'),
  ('Tecún Umán','San Marcos')
on conflict (nombre, departamento) do nothing;

insert into public.organizaciones (nombre, ciudad_id, tipo_id, telefono, nota, verificado)
select 'Casa del Migrante (Misioneros Escalabrinianos)', c.id, t.id, '2230-2781',
       '15 Av. 1-94 "A" Zona 1. Asesoría en trámites migratorios.', true
from public.ciudades c, public.tipos_organizacion t
where c.nombre = 'Ciudad de Guatemala' and t.nombre = 'Albergue'
  and not exists (
    select 1 from public.organizaciones o
    where o.nombre = 'Casa del Migrante (Misioneros Escalabrinianos)'
  );

insert into public.organizaciones (nombre, ciudad_id, tipo_id, telefono, nota, verificado)
select 'Cruz Roja Guatemalteca', c.id, t.id, '2381-6565',
       'Atención médica, información y emergencias (línea 125, 24h).', true
from public.ciudades c, public.tipos_organizacion t
where c.nombre = 'Ciudad de Guatemala' and t.nombre = 'Salud'
  and not exists (
    select 1 from public.organizaciones o
    where o.nombre = 'Cruz Roja Guatemalteca'
  );

insert into public.organizaciones (nombre, ciudad_id, tipo_id, nota, verificado)
select 'Casa Nuestras Raíces (SBS)', c.id, t.id,
       'Recepción y reunificación familiar de niñez migrante retornada. Coordinado por SBS.', true
from public.ciudades c, public.tipos_organizacion t
where c.nombre = 'Quetzaltenango' and t.nombre = 'Atención a retornados'
  and not exists (
    select 1 from public.organizaciones o
    where o.nombre = 'Casa Nuestras Raíces (SBS)'
  );

insert into public.organizaciones (nombre, ciudad_id, tipo_id, nota, verificado)
select 'Albergue para Migrantes Tecún Umán', c.id, t.id,
       'Refugio en la frontera con México, apoyo de la Pastoral de Movilidad Humana.', true
from public.ciudades c, public.tipos_organizacion t
where c.nombre = 'Tecún Umán' and t.nombre = 'Albergue'
  and not exists (
    select 1 from public.organizaciones o
    where o.nombre = 'Albergue para Migrantes Tecún Umán'
  );

insert into public.publicaciones (
  id, autor_id, categoria_id, alias_mostrado, texto, anonimo, estado, creado_en, actualizado_en
)
overriding system value
values
  (
    1, null, 1, 'CaminanteSolidario',
    'En Tecún Umán hay un punto de socorro de Cruz Roja donde entregan suero y curan ampollas sin costo ni pedir documentos. Si sienten los pies lastimados, paren a revisarse antes de continuar.',
    false, 'visible', '2026-10-28T18:30:00Z', '2026-10-28T18:30:00Z'
  ),
  (
    2, null, 4, 'AlertaRuta',
    'Atención: cerca de la terminal de buses hay personas no identificadas cobrando por "salvoconductos" y trámites rápidos. Todo trámite oficial y la ayuda en albergues es gratuita. No entreguen dinero.',
    false, 'visible', '2026-10-28T21:10:00Z', '2026-10-28T21:10:00Z'
  ),
  (
    3, null, 3, 'Anónimo',
    'A todas las familias y compañeros que van hoy por la costa sur con niños: mucha paciencia y fuerza. No están solos, entre nosotros nos cuidamos. Recuerden descansar bajo sombra en las horas de más sol.',
    true, 'visible', '2026-10-29T08:15:00Z', '2026-10-29T08:15:00Z'
  ),
  (
    4, null, 2, 'ViajeraSegura',
    '¿Alguien sabe si la Casa del Migrante en Ciudad de Guatemala tiene lugar para mujeres solas hoy o a qué hora cierran la recepción de noche?',
    false, 'visible', '2026-10-29T11:40:00Z', '2026-10-29T11:40:00Z'
  ),
  (
    5, null, 1, 'HermanoDeRuta',
    'Consejo para cuidar los pies: lleven dos pares de calcetines limpios y secos en una bolsa plástica sellada. Cámbiense al mediodía y pongan el talco o vaselina en las zonas de fricción.',
    false, 'visible', '2026-10-29T13:00:00Z', '2026-10-29T13:00:00Z'
  )
on conflict (id) do nothing;

select setval(
  pg_get_serial_sequence('public.publicaciones', 'id'),
  coalesce((select max(id) from public.publicaciones), 1),
  true
);

insert into public.reportes (id, publicacion_id, reportado_por, motivo, estado, creado_en)
overriding system value
values (
  1, 2, null,
  'Verificación de alerta: Mención de cobros sospechosos en terminal. Requiere revisión de seguridad.',
  'pendiente', '2026-10-29T10:15:00Z'
)
on conflict (id) do nothing;

select setval(
  pg_get_serial_sequence('public.reportes', 'id'),
  coalesce((select max(id) from public.reportes), 1),
  true
);
