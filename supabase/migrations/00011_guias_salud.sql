-- 00011_guias_salud.sql
-- Gestión de contenidos informativos de salud y autocuidado para administración

create table public.guias_salud (
  id bigint primary key generated always as identity,
  slug text not null unique,
  categoria text not null check (categoria in ('pies', 'hidratacion', 'calor', 'emocional', 'mujeres', 'general')),
  titulo text not null,
  resumen text not null,
  instrucciones text[] not null default '{}',
  alerta_medica text,
  orden smallint not null default 0,
  creado_por uuid references public.perfiles(id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  eliminado_en timestamptz
);

create trigger trg_guias_salud_actualizado
  before update on public.guias_salud
  for each row execute function public.actualizar_timestamp();

alter table public.guias_salud enable row level security;

create policy "guias_salud: lectura publica" on public.guias_salud
  for select using (eliminado_en is null);

create policy "guias_salud: solo moderadores insertan" on public.guias_salud
  for insert with check (public.es_moderador());

create policy "guias_salud: solo moderadores actualizan" on public.guias_salud
  for update using (public.es_moderador());

create policy "guias_salud: solo moderadores eliminan" on public.guias_salud
  for delete using (public.es_moderador());

create index idx_guias_salud_categoria on public.guias_salud (categoria) where eliminado_en is null;

-- Datos semilla iniciales para guías de salud y autocuidado
insert into public.guias_salud (slug, categoria, titulo, resumen, instrucciones, alerta_medica, orden) values
  (
    'cuidado-pies-ampollas',
    'pies',
    'Cuidado de pies y tratamiento de ampollas',
    'Tus pies son tu medio de transporte. Prevenir infecciones y ampollas es vital para no detener tu paso.',
    array[
      'Evita reventar las ampollas; la piel superior actúa como apósito natural que protege contra bacterias.',
      'Si una ampolla se revienta, lava suavemente con agua y jabón neutro. No apliques alcohol ni ceniza.',
      'Aplica vaselina o crema densa entre los dedos y talones antes de comenzar a caminar para reducir fricción.',
      'Mantén calcetines secos en bolsa impermeable y rótalos a mitad de jornada.',
      'Eleva los pies sobre tu mochila 15 minutos al descansar para desinflamar.'
    ],
    'Si la zona está roja brillante, muy caliente, supura líquido espeso o te da fiebre, busca auxilio médico de inmediato.',
    1
  ),
  (
    'suero-oral-deshidratacion',
    'hidratacion',
    'Suero oral casero y agua segura',
    'Beber solo agua natural en caminatas intensas no repone los minerales perdidos por el sudor. Aprende a preparar suero de emergencia.',
    array[
      'Fórmula casera: en 1 litro de agua limpia disuelve 6 cucharaditas de azúcar y 1/2 cucharadita de sal.',
      'Si tienes a mano limón o naranja, agrégalo para aportar potasio y mejorar sabor.',
      'Bebe a pequeños sorbos frecuentes cada 20 minutos, nunca un litro de golpe.',
      'Para purificar agua dudosa: hierve 3 minutos a fuego vivo o añade 2 gotas de cloro comercial por litro y espera 30 minutos.'
    ],
    'Signos de deshidratación grave: boca reseca, ojos hundidos, orina oscura o ausente, pulso acelerado o confusión.',
    2
  ),
  (
    'prevencion-golpe-calor',
    'calor',
    'Prevención de golpe de calor e insolación',
    'Las temperaturas en las costas y fronteras pueden superar los 35°C. El golpe de calor puede ser mortal.',
    array[
      'Camina en horas frescas (5:00 a 11:00 AM) y resguárdate bajo sombra entre 11:30 AM y 3:30 PM.',
      'Cubre cabeza y nuca con tela clara humedecida con agua fresca.',
      'Usa ropa suelta y de colores claros que permita la transpiración.',
      'Primeros auxilios: llevar a la sombra, aflojar ropa, poner paños frescos en cuello, axilas e ingle y dar suero despacio.'
    ],
    'Si la persona deja de sudar, tiene la piel ardiendo y enrojecida o pierde el conocimiento, llama urgentemente al 122 o 125.',
    3
  ),
  (
    'primeros-auxilios-emocionales',
    'emocional',
    'Primeros auxilios emocionales y manejo de crisis',
    'El miedo, la incertidumbre y el agotamiento son normales en la ruta. Cuidar tu mente te ayuda a tomar decisiones seguras.',
    array[
      'Técnica 4-4-4: inhala por la nariz en 4 segundos, retén 4 segundos y exhala suavemente por la boca en 4 segundos.',
      'Anclaje sensorial en pánico: nombra 5 cosas que ves, 4 que tocas, 3 que oyes y 2 que hueles.',
      'Con la niñez: háblales con voz calmada, asegúrales que están juntos y evita transmitir rumores alarmistas.',
      'Acuerda una palabra clave con tu acompañante para avisar si necesitas parar o sientes riesgo.'
    ],
    'Si sientes desespero extremo o pensamientos de autolesión, PDH (1555) y Cruz Roja (125) brindan apoyo psicológico confidencial.',
    4
  ),
  (
    'salud-mujeres-gestantes',
    'mujeres',
    'Salud de mujeres, gestantes e infancia',
    'Pautas de cuidado prioritario para mujeres embarazadas, madres en lactancia y niñas en tránsito.',
    array[
      'En embarazo: lleva tu carné de control médico o historial en bolsa hermética pegada a tu cuerpo.',
      'Descansa con las piernas en alto al menos 20 minutos cada 2 horas de caminata continua.',
      'Lactancia materna: el pecho es el alimento más limpio y seguro para tu bebé; no lo suspendas.',
      'Higiene íntima: cambia compresas limpias con frecuencia; evita usar telas sin hervir previamente.'
    ],
    'Señales de alarma obstétrica: sangrado vaginal, pérdida de líquido, dolor cólico fuerte o si el bebé deja de moverse.',
    5
  );
