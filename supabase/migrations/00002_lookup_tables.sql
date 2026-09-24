create table public.categorias (
  id smallint primary key generated always as identity,
  nombre text not null unique,
  descripcion text
);

create table public.ciudades (
  id smallint primary key generated always as identity,
  nombre text not null,
  departamento text not null,
  unique (nombre, departamento)
);

create table public.tipos_organizacion (
  id smallint primary key generated always as identity,
  nombre text not null unique
);

insert into public.categorias (nombre, descripcion) values
  ('Consejo', 'Consejo práctico de otro migrante'),
  ('Pregunta', 'Solicitud de orientación'),
  ('Ánimo', 'Mensaje de apoyo emocional'),
  ('Alerta', 'Aviso de estafa o riesgo');

insert into public.tipos_organizacion (nombre) values
  ('Albergue'),('Salud'),('Legal'),('Atención a retornados'),('Orientación'),('Comedor');