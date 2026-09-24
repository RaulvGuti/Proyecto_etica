insert into public.ciudades (nombre, departamento) values
  ('Ciudad de Guatemala','Guatemala'),
  ('Quetzaltenango','Quetzaltenango'),
  ('Tecún Umán','San Marcos');

insert into public.organizaciones (nombre, ciudad_id, tipo_id, telefono, nota, verificado)
select 'Casa del Migrante (Misioneros Escalabrinianos)', c.id, t.id, '2230-2781',
       '15 Av. 1-94 "A" Zona 1. Asesoría en trámites migratorios.', true
from public.ciudades c, public.tipos_organizacion t
where c.nombre = 'Ciudad de Guatemala' and t.nombre = 'Albergue';

insert into public.organizaciones (nombre, ciudad_id, tipo_id, telefono, nota, verificado)
select 'Cruz Roja Guatemalteca', c.id, t.id, '2381-6565',
       'Atención médica, información y emergencias (línea 125, 24h).', true
from public.ciudades c, public.tipos_organizacion t
where c.nombre = 'Ciudad de Guatemala' and t.nombre = 'Salud';

insert into public.organizaciones (nombre, ciudad_id, tipo_id, nota, verificado)
select 'Casa Nuestras Raíces (SBS)', c.id, t.id,
       'Recepción y reunificación familiar de niñez migrante retornada. Coordinado por SBS.', true
from public.ciudades c, public.tipos_organizacion t
where c.nombre = 'Quetzaltenango' and t.nombre = 'Atención a retornados';

insert into public.organizaciones (nombre, ciudad_id, tipo_id, nota, verificado)
select 'Albergue para Migrantes Tecún Umán', c.id, t.id,
       'Refugio en la frontera con México, apoyo de la Pastoral de Movilidad Humana.', true
from public.ciudades c, public.tipos_organizacion t
where c.nombre = 'Tecún Umán' and t.nombre = 'Albergue';