# Bitacora de Cambios (AI Agent Changelog)

> **REGLA FUNDAMENTAL DE MANTENIMIENTO:**
> Esta bitacora es **estrictamente acumulativa y permanente**.
> **NUNCA DEBEN ELIMINARSE REGISTROS PREVIOS**.
> Cualquier agente de IA o desarrollador que realice modificaciones en el repositorio debe dejar constancia de sus cambios agregando una nueva entrada cronologica al final de este archivo, especificando fecha, contexto, archivos tocados, decisiones arquitectonicas y comandos de verificacion.

---

## Indice de Entradas

- [Entrada 001 - 2026-10-19: Implementacion de Workflows de GitHub, Gobernanza en Espanol y Documentacion](#entrada-001---2026-10-19-implementacion-de-workflows-de-github-gobernanza-en-espanol-y-documentacion)
- [Entrada 002 - 2026-10-29: Implementacion de las Paginas de Salud, Comunidad y Directorio](#entrada-002---2026-10-29-implementacion-de-las-paginas-de-salud-comunidad-y-directorio)
- [Entrada 003 - 2026-10-29: Migracion de Guias de Salud y Panel Unificado de Administracion y Moderacion](#entrada-003---2026-10-29-migracion-de-guias-de-salud-y-panel-unificado-de-administracion-y-moderacion)
- [Entrada 005 - 2026-11-03: Correccion de Conexion Publica, RLS Explicita y Respaldo ante Supabase No Disponible](#entrada-005---2026-11-03-correccion-de-conexion-publica-rls-explicita-y-respaldo-ante-supabase-no-disponible)

---

## Entrada 001 - 2026-10-19: Implementacion de Workflows de GitHub, Gobernanza en Espanol y Documentacion

### 1. Contexto y Solicitud del Usuario
Se solicito utilizar el catalogo de plantillas ubicado en `plantillas-github/` para configurar los workflows de GitHub Actions, plantillas de issues, PRs y normas de commits en espanol adaptadas al proyecto. Ademas, se solicito analizar los lenguajes y arquitectura del repositorio, generar esta carpeta `docs/` con el historial de cambios sin borrar lo anterior, e indexar `docs/` en `AGENTS.md`.

### 2. Analisis de Lenguajes y Arquitectura del Repositorio
- **Lenguajes detectados**:
  - **TypeScript / JavaScript**: Codigo de aplicacion Next.js 16, componentes React 19, configuraciones de tooling.
  - **SQL (PostgreSQL)**: Migraciones versionadas en `supabase/migrations/` (del `00001_` al `00010_`), funciones, triggers y politicas RLS; script de seed en `supabase/seed.sql`.
  - **CSS / PostCSS**: Tailwind CSS v4 en `src/styles/globals.css`.
- **Estructura y Dominio ("Puente")**:
  - `src/app/`: Rutas de la aplicacion (App Router de Next.js).
  - `src/components/`: Componentes modulares de interfaz (NavBar, EmergencyBar, etc.).
  - `src/lib/supabase/`: Clientes de Supabase para servidor (`server.ts`) y cliente (`client.ts`) usando `@supabase/ssr` y cookies.
  - `supabase/migrations/`: 10 migraciones SQL estructuradas bajo el estandar `^[0-9]{5}_[a-z0-9_]+\.sql$`.
  - Modulos del dominio: perfiles/auth, organizaciones, publicaciones/comunidad, reportes/emergencias, ui e infra.
- **Gestor de Paquetes y Entorno**:
  - Uso de **`npm`** (`package-lock.json`), no pnpm.
  - Rama de integracion y produccion actual: **`main`**.

### 3. Modificaciones y Archivos Creados

#### Tooling y Scripts
- [package.json](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/package.json):
  - Se anadio el script `"typecheck": "tsc --noEmit"` para permitir ejecucion directa tanto en local como en CI.
- [.editorconfig](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.editorconfig):
  - Configuracion de codificacion UTF-8, fin de linea LF, indentacion de 2 espacios (con soporte para TS, TSX, CSS, SQL, JSON y Markdown).
- [.gitattributes](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.gitattributes):
  - Normalizacion obligatoria de finales de linea a LF y marcacion de archivos binarios y generados (`package-lock.json`).
- [.pre-commit-config.yaml](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.pre-commit-config.yaml):
  - Comprobaciones locales: limpieza de espacios, formato YAML/JSON, corte de claves privadas, `gitleaks` para prevencion de fugas de secretos, bloqueo de commits directos a `main` y ejecucion local de `npm run lint`.

#### Workflows de GitHub Actions (`.github/workflows/`)
- [.github/workflows/validar-pr.yml](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.github/workflows/validar-pr.yml):
  - Validacion del titulo del PR en espanol bajo Conventional Commits (`feat(alcance): ...`, `fix(alcance): ...`, etc.).
  - Filtro contra archivos prohibidos (`.env`, certificados, volcados de base de datos) con **excepcion expresa para las migraciones y seed de Supabase** (`^supabase/migrations/.*\.sql$`, `^supabase/seed\.sql$`), evitando falsos positivos que bloqueen el trabajo con la base de datos.
  - Aviso preventivo si el PR excede las 1500 lineas.
- [.github/workflows/ci.yml](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.github/workflows/ci.yml):
  - Adaptado a Next.js y `npm` (usando `npm ci`, cache de `npm` y Node.js 20).
  - Ejecuta secuencialmente: `npm run lint` (ESLint), `npm run typecheck` (TypeScript) y `npm run build` (Next.js).
  - Incluye `npm audit --audit-level=high` con `continue-on-error: true`.
- [.github/workflows/migraciones.yml](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.github/workflows/migraciones.yml):
  - Guarda de inmutabilidad: falla si se modifica o borra una migracion existente en `supabase/migrations/`, permitiendo bypass voluntario mediante la etiqueta `migracion-editada-a-proposito`.
  - Valida el formato de nombres `NNNNN_descripcion.sql` y verifica que no existan prefijos duplicados.
  - Valida el esquema levantando un contenedor local con Supabase CLI `2.117.0` (`supabase start`, `supabase db reset`, `supabase db lint`).
- [.github/workflows/etiquetado.yml](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.github/workflows/etiquetado.yml):
  - Etiquetado automatico de PRs por rutas con `actions/labeler@v5`.

#### Gobernanza y Plantillas (`.github/`)
- [.github/pull_request_template.md](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.github/pull_request_template.md):
  - Plantilla en espanol con checklist de pruebas locales (`npm run lint && npm run typecheck && npm run build`) y checklist de seguridad especifico para Supabase RLS y Next.js.
- [.github/labeler.yml](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.github/labeler.yml):
  - Mapeo de rutas a modulos del proyecto (`module:supabase`, `module:perfiles`, `module:organizaciones`, `module:publicaciones`, `module:reportes`, `module:ui`, `module:infra`, `type:docs`).
- [.github/labels.yml](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.github/labels.yml):
  - Catalogo completo de etiquetas en 4 dimensiones (tipo, modulo, prioridad, estado) mas automatismos.
- [.github/dependabot.yml](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.github/dependabot.yml):
  - Actualizaciones automaticas semanales agrupadas para `github-actions` y `npm` (desarrollo y produccion).
- [.github/release.yml](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.github/release.yml):
  - Categorizacion automatica de notas de version en espanol.
- [.github/CODEOWNERS](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.github/CODEOWNERS):
  - Asignacion a `@RaulvGuti` como mantenedor principal.
- [.github/SECURITY.md](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.github/SECURITY.md):
  - Politica de reporte responsable de vulnerabilidades en espanol.
- [.github/ISSUE_TEMPLATE/](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.github/ISSUE_TEMPLATE/):
  - `config.yml`: Desactiva issues en blanco.
  - `01-bug.yml`, `02-feature.yml`, `03-deuda-tecnica.yml`, `04-seguridad.yml`, `05-docs.yml`: Formularios YAML interactivos en espanol con titulos prefijados en Conventional Commits y modulos del proyecto.

#### Documentacion e Indexacion
- [docs/README.md](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/docs/README.md):
  - Indice maestro del directorio de documentacion.
- [docs/BITACORA_CAMBIOS.md](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/docs/BITACORA_CAMBIOS.md):
  - Este documento acumulativo.
- [docs/GUIA_WORKFLOWS_Y_CONVENCIONES.md](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/docs/GUIA_WORKFLOWS_Y_CONVENCIONES.md):
  - Manual exhaustivo de convenciones de commits, flujos de trabajo, proteccion de migraciones y arquitectura.
- [AGENTS.md](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/AGENTS.md):
  - Actualizado para indexar la carpeta `docs/`, instruir a agentes futuros a consultar la guia de workflows y registrar obligatoriamente sus cambios en esta bitacora sin borrar entradas previas.

### 4. Verificacion Realizada
- `npm run lint`: Exito (0 advertencias, 0 errores).
- `npm run typecheck`: Exito (TypeScript compila sin errores).
- `npm run build`: Exito (Build de produccion Next.js 16 generado correctamente con Turbopack).

---

## Entrada 002 - 2026-10-29: Implementacion de las Paginas de Salud, Comunidad y Directorio

### 1. Contexto y Solicitud del Usuario
Se solicito la creacion completa de las tres paginas faltantes del portal **Puente**:
1. **Salud y Autocuidado** (`/salud`)
2. **Comunidad** (`/comunidad`)
3. **Directorio** (`/directorio`)

Con las premisas de basarse fielmente en el frontend existente, conectarse profundamente a las 10 migraciones de base de datos de Supabase existentes y entregar una estetica y funcionalidad perfectamente integradas con la arquitectura y pautas eticas del proyecto.

### 2. Decisiones Arquitectonicas y Tecnicas
- **Alineacion total con el esquema de base de datos**:
  - `src/types/database.ts`: Modelado estricto de tipos para las tablas de las migraciones (`categorias`, `ciudades`, `tipos_organizacion`, `perfiles`, `organizaciones`, `publicaciones`, `reportes`).
  - `src/lib/initialData.ts`: Catalogo estructurado de datos semilla y guias medicas humanitarias en ruta, alineado al 100% con `supabase/seed.sql` y las migraciones `00002_lookup_tables.sql` a `00006_reportes.sql`.
  - Resiliencia y tolerancia a fallos offline: En caso de que el contenedor de Supabase no este corriendo localmente o en entornos de build en CI, la aplicacion usa fallbacks inteligentes que impiden que el renderizado o compilacion estatica falle, mientras que al estar conectado a Supabase ejecuta las consultas y mutaciones en vivo con RLS activo.
- **Frontend y Sistema de Diseno**:
  - Se extendio `src/styles/globals.css` respetando las variables de color de Puente (`--bg`, `--surface`, `--ink`, `--muted`, `--primary`, `--danger`, `--line`), implementando tarjetas interactivas, badges semanticos de categorizacion, modales accesibles, barras de filtros y buscadores en tiempo real.
- **Paginas Implementadas**:
  - `src/app/salud/page.tsx`: Modulo integral con lineas de urgencia medica 24h (Cruz Roja 125, Bomberos 122/123, PDH 1555), conmutador de guias interactivas de autocuidado en ruta (pies/ampollas, suero oral casero, golpe de calor, primeros auxilios emocionales, salud de mujeres) y directorio de centros de salud y Cruz Roja filtrables por ciudad/departamento.
  - `src/app/comunidad/page.tsx`: Espacio seguro con feed cronologico de publicaciones segun `00005_publicaciones.sql` y `00009_indexes.sql`, filtros por categoria (`Consejo`, `Pregunta`, `Ánimo`, `Alerta`), buscador en tiempo real, formulario con conteo de caracteres (hasta 2000) y soporte para publicacion anonima, mas modal de reportes conectado a `00006_reportes.sql` (`reportes`).
  - `src/app/directorio/page.tsx`: Directorio integral de recursos de acogida segun `00004_organizaciones.sql`, con filtros combinados por tipo (`Albergue`, `Salud`, `Legal`, `Atención a retornados`, `Orientación`, `Comedor`), ubicacion geografica (`ciudades`), filtro de organizaciones verificadas, enlaces de llamada telefonica directa y modal para sugerir nuevos puntos de apoyo.
  - `src/app/page.tsx`: Se integro una seccion de acceso rapido visual a las tres areas desde el Hero principal manteniendo intacto el bloque SOS original.

### 3. Archivos Tocados y Creados
- [src/types/database.ts](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/src/types/database.ts) (Nuevo)
- [src/lib/initialData.ts](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/src/lib/initialData.ts) (Nuevo)
- [src/app/salud/page.tsx](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/src/app/salud/page.tsx) (Nuevo)
- [src/app/comunidad/page.tsx](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/src/app/comunidad/page.tsx) (Nuevo)
- [src/app/directorio/page.tsx](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/src/app/directorio/page.tsx) (Nuevo)
- [src/lib/supabase/client.ts](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/src/lib/supabase/client.ts) (Modificado: valores de respaldo seguros para variables de entorno)
- [src/lib/supabase/server.ts](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/src/lib/supabase/server.ts) (Modificado: valores de respaldo seguros para variables de entorno)
- [src/styles/globals.css](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/src/styles/globals.css) (Modificado: extension del sistema de diseno)
- [src/app/page.tsx](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/src/app/page.tsx) (Modificado: accesos directos a las tres secciones)
- [docs/BITACORA_CAMBIOS.md](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/docs/BITACORA_CAMBIOS.md) (Modificado: registro acumulativo de esta intervencion)

### 4. Verificacion Realizada
- `npm run lint`: Exito (0 advertencias, 0 errores).
- `npm run typecheck`: Exito (TypeScript compila sin errores).
- `npm run build`: Exito (Build de produccion Next.js 16 generado con Turbopack; las 4 rutas `/`, `/salud`, `/comunidad`, `/directorio` pre-renderizadas exitosamente).

---

## Entrada 003 - 2026-10-29: Migracion de Guias de Salud y Panel Unificado de Administracion y Moderacion

### 1. Contexto y Solicitud del Usuario
El usuario solicito:
1. Crear una nueva migracion de base de datos para almacenar y administrar la informacion de autocuidado y salud.
2. Implementar la recepcion de reportes de la comunidad para que el administrador pueda revisarlos, descartarlos u ocultar/retirar publicaciones infractoras.
3. Permitir que solo el administrador pueda registrar, verificar y dar de alta organizaciones en el directorio oficial.
4. Unificar temporalmente las 3 areas de administracion en un solo panel para facilitar la entrega y evaluacion inmediata del proyecto.

### 2. Decisiones Arquitectonicas y de Base de Datos
- **Nueva Migracion Inmutable de Supabase (`00011_guias_salud.sql`)**:
  - Se creo cumpliendo estrictamente el patron `^[0-9]{5}_[a-z0-9_]+\.sql$` sin modificar migraciones previas.
  - Tabla `public.guias_salud`: campos `id`, `slug`, `categoria`, `titulo`, `resumen`, `instrucciones` (`text[]`), `alerta_medica`, `orden`, `creado_por`, `creado_en`, `actualizado_en`, `eliminado_en`.
  - Trigger `trg_guias_salud_actualizado` conectado a `public.actualizar_timestamp()`.
  - Politicas RLS estrictas: lectura publica para registros no eliminados (`eliminado_en is null`), insercion, actualizacion y borrado restringidos exclusivamente a `public.es_moderador()`.
  - Indice `idx_guias_salud_categoria`.
  - Carga automatica de datos semilla de guias de salud humanitarias.
- **Panel Unificado de Administracion (`src/app/admin/page.tsx`)**:
  - **Pestana 1 (Comunidad y Moderacion)**: Bandeja de entrada de reportes eticos conectados a `public.reportes` y `public.publicaciones`. Permite visualizar el motivo de la denuncia, el autor y texto original, con botones de accion rapida para descartar el reporte o sancionar la publicacion marcandola como `oculto` (retirandola de inmediato del feed publico).
  - **Pestana 2 (Salud y Autocuidado)**: Formulario completo para publicar nuevas guias medicas y pasos de auxilio en ruta, y tabla con accion de dar de baja.
  - **Pestana 3 (Directorio Oficial)**: Modulo exclusivo para registrar formalmente albergues, clinicas, comedores y defensorias legales con seleccion de ciudad y tipo, asignacion del sello de verificacion oficial y gestion de bajas.
- **Navegacion y Diseno**:
  - Se anadio el enlace directo al panel de control en `NavBar.tsx` (`Administración 🛡️`).
  - Se incorporaron estilos para tablas administrativas, tarjetas de reporte con alertas de color e indicadores de estado (`badge-pendiente`, `badge-revisado`, `badge-descartado`).

### 3. Archivos Tocados y Creados
- [supabase/migrations/00011_guias_salud.sql](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/supabase/migrations/00011_guias_salud.sql) (Nuevo: migracion de guias de salud)
- [src/types/database.ts](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/src/types/database.ts) (Modificado: interfaces `GuiaSalud` y `ReporteConPublicacion`)
- [src/lib/initialData.ts](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/src/lib/initialData.ts) (Modificado: datos iniciales para reportes y guias de salud)
- [src/app/salud/page.tsx](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/src/app/salud/page.tsx) (Modificado: conectado a la tabla `guias_salud`)
- [src/app/admin/page.tsx](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/src/app/admin/page.tsx) (Nuevo: panel unificado de administracion con las 3 areas)
- [src/components/NavBar.tsx](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/src/components/NavBar.tsx) (Modificado: enlace de navegacion a administracion)
- [src/styles/globals.css](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/src/styles/globals.css) (Modificado: clases CSS para panel, reportes y tablas de admin)
- [docs/BITACORA_CAMBIOS.md](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/docs/BITACORA_CAMBIOS.md) (Modificado: registro acumulativo de esta intervencion)

### 4. Verificacion Realizada
- `npm run lint`: Exito (0 advertencias, 0 errores).
- `npm run typecheck`: Exito (TypeScript compila sin errores).
- `npm run build`: Exito (Build de produccion Next.js 16 generado con Turbopack; 5 rutas `/`, `/salud`, `/comunidad`, `/directorio`, `/admin` pre-renderizadas exitosamente).

---

## Entrada 005 - 2026-11-03: Correccion de Conexion Publica, RLS Explicita y Respaldo ante Supabase No Disponible

### 1. Contexto y Solicitud del Usuario
Se reporto un HTTP 500 con espera aproximada de 7 segundos en los endpoints publicos `GET /api/publicaciones` y `GET /api/organizaciones`, mientras que el panel `/admin` parecia seguir mostrando datos. Se solicito revisar las politicas RLS de lectura anonima, reforzar las API Routes publicas, conectar las vistas `/comunidad`, `/directorio` y `/salud`, verificar lint/typecheck/build y registrar esta intervencion de forma acumulativa.

### 2. Diagnostico Tecnico
- **Causa principal**: El archivo `.env.local` apunta a Supabase local en `http://127.0.0.1:54321`, pero el puerto estaba cerrado y Docker no estaba disponible. Las consultas no podian establecer conexion.
- **Motivo del falso positivo en `/admin`**: El panel inicializa sus estados con `REPORTES_INICIALES`, `ORGANIZACIONES_INICIALES`, `GUIAS_SALUD_DB_INICIALES`, etc. Por eso mostraba informacion aun sin una base de datos activa.
- **Demora de 7 segundos**: `@supabase/postgrest-js` reintenta automaticamente las solicitudes GET fallidas con retroceso exponencial (1s + 2s + 4s). Eso explicaba la espera de ~7 segundos antes del error, incluso con un timeout de red de 5 segundos.
- **Estado previo de RLS**: Las migraciones `00008_rls_policies.sql`, `00010_lookup_rls.sql` y `00011_guias_salud.sql` ya contenian politicas de lectura publica, pero no estaban declaradas explicitamente para `TO anon, authenticated` ni se aseguraban los `GRANT SELECT`.
- **Conflicto de numeracion**: Ya existia `00012_ajustes_seguridad_conexion.sql`; por inmutabilidad y por la validacion de prefijos duplicados del workflow, la nueva migracion se creo como `00013_...`.

### 3. Cambios Realizados
- [supabase/migrations/00013_politicas_rls_publicas.sql](file:///c:/Users/usuario/documents/github/proyecto_etica/supabase/migrations/00013_politicas_rls_publicas.sql) (Nuevo):
  - Politicas `SELECT TO anon, authenticated` explicitas para `publicaciones`, `organizaciones`, `guias_salud`, `categorias`, `ciudades` y `tipos_organizacion`.
  - `publicaciones` visible y no eliminada; `organizaciones` y `guias_salud` no eliminadas; catalogos de lectura libre.
  - `GRANT SELECT` para las tablas publicas y `GRANT INSERT` para los aportes ciudadanos en `publicaciones`, `organizaciones` y `reportes`.
- [src/lib/supabase/server.ts](file:///c:/Users/usuario/documents/github/proyecto_etica/src/lib/supabase/server.ts) (Modificado):
  - Se agrego `createPublicServerClient()` con clave anonima, sin cookies y con timeout de red de 5 segundos.
  - Se centralizo la configuracion de Supabase y se aplico el timeout al cliente de servidor existente.
- [src/app/api/publicaciones/route.ts](file:///c:/Users/usuario/documents/github/proyecto_etica/src/app/api/publicaciones/route.ts) (Modificado):
  - GET con cliente publico, `force-dynamic`, consulta paralela de publicaciones y categorias, y `.retry(false)` para evitar la demora de 7 segundos.
  - Respaldo automatico con `PUBLICACIONES_INICIALES` y `CATEGORIAS_INICIALES` cuando Supabase no responde, devolviendo `200` con `fuente: "respaldo_local"` y `advertencia`.
  - POST con manejo defensivo y error JSON explicativo.
- [src/app/api/organizaciones/route.ts](file:///c:/Users/usuario/documents/github/proyecto_etica/src/app/api/organizaciones/route.ts) (Modificado):
  - GET con cliente publico, consulta paralela de organizaciones, ciudades y tipos, `.retry(false)` y respaldo con datos iniciales.
  - POST con manejo defensivo y error JSON explicativo.
- [src/app/api/guias-salud/route.ts](file:///c:/Users/usuario/documents/github/proyecto_etica/src/app/api/guias-salud/route.ts) (Modificado):
  - GET con cliente publico, `.retry(false)` y respaldo con `GUIAS_SALUD_DB_INICIALES`.
- [src/app/api/reportes/route.ts](file:///c:/Users/usuario/documents/github/proyecto_etica/src/app/api/reportes/route.ts) (Modificado):
  - Uso del cliente publico con timeout y errores JSON mas claros.
- [src/app/comunidad/page.tsx](file:///c:/Users/usuario/documents/github/proyecto_etica/src/app/comunidad/page.tsx) (Modificado):
  - La vista consume primero `/api/publicaciones`, inicializa con datos de respaldo y muestra un aviso no bloqueante cuando se usa respaldo local.
  - Los envios de publicaciones y reportes usan las API Routes publicas y muestran mensajes de error legibles.
- [src/app/directorio/page.tsx](file:///c:/Users/usuario/documents/github/proyecto_etica/src/app/directorio/page.tsx) (Modificado):
  - La vista consume `/api/organizaciones` para organizaciones, ciudades y tipos, con respaldo local y aviso visual.
  - Las sugerencias ciudadanas se envian por la API publica con manejo de errores.
- [src/app/salud/page.tsx](file:///c:/Users/usuario/documents/github/proyecto_etica/src/app/salud/page.tsx) (Modificado):
  - La vista consume `/api/organizaciones` y `/api/guias-salud`, mantiene respaldo local y usa las ciudades devueltas por la API.
- [docs/BITACORA_CAMBIOS.md](file:///c:/Users/usuario/documents/github/proyecto_etica/docs/BITACORA_CAMBIOS.md) (Modificado: esta entrada acumulativa).

### 4. Comportamiento Resultante
- Si Supabase esta disponible, las API publicas devuelven datos reales con `fuente: "supabase"`.
- Si Supabase no esta disponible, las API responden en milisegundos con `200`, datos iniciales y `advertencia`, evitando el HTTP 500 y la espera de 7 segundos.
- Las vistas publicas se renderizan siempre con contenido y muestran el aviso de modo de respaldo.
- La aplicacion queda preparada para produccion cambiando `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el entorno de despliegue.

### 5. Verificacion Realizada
- `npm run lint`: Exito (0 advertencias, 0 errores).
- `npm run typecheck`: Exito (TypeScript compila sin errores).
- `npm run build`: Exito (Build de produccion Next.js 16 con Turbopack; API Routes dinamicas y paginas publicas pre-renderizadas).
- Prueba de runtime con Supabase local apagado:
  - `GET /api/publicaciones`: `200`, ~46 ms, `fuente: "respaldo_local"`.
  - `GET /api/organizaciones`: `200`, ~47 ms, `fuente: "respaldo_local"`.
  - `GET /api/guias-salud`: `200`, ~36 ms, `fuente: "respaldo_local"`.
- La validacion real de RLS queda pendiente de activar Supabase local o configurar un proyecto hospedado; la migracion y los grants quedan listos para aplicarse.

---

## Entrada 006 - 2026-11-03: Vinculacion y Despliegue del Esquema a Supabase Cloud

### 1. Contexto y Solicitud del Usuario
Se solicito desplegar el esquema local en Supabase Cloud, aplicando las migraciones `00001` a `00013` y el archivo `seed.sql`, actualizar las variables de entorno de la aplicacion y verificar que las vistas publicas y el panel de administracion funcionen sin modo degradado.

### 2. Proyecto Cloud Utilizado
- Nombre: `Final-Etica`.
- Referencia (`project-ref`): `hagnzcajoovznixrqtoc`.
- Region: `us-east-1`.
- Motor: PostgreSQL `17.11.0.011`.
- Estado al momento del despliegue: `ACTIVE_HEALTHY`.

### 3. Cambios Realizados
- [supabase/config.toml](file:///c:/Users/usuario/documents/github/proyecto_etica/supabase/config.toml) (Nuevo): configuracion local generada con `npx supabase init --yes`, con `project_id = "Proyecto_etica"`, API local en `54321`, base local en `54322` y PostgreSQL 17.
- [supabase/.gitignore](file:///c:/Users/usuario/documents/github/proyecto_etica/supabase/.gitignore) (Nuevo): exclusion de artefactos locales generados por la CLI.
- Vinculacion del proyecto cloud mediante `npx supabase link --project-ref hagnzcajoovznixrqtoc --yes`.
- Aplicacion remota de las migraciones `00001_extensions.sql` a `00013_politicas_rls_publicas.sql` mediante `npx supabase db push --include-seed`.
- Carga remota de los datos de `supabase/seed.sql`: 3 ciudades y 4 organizaciones verificadas.
- [.env.local](file:///c:/Users/usuario/documents/github/proyecto_etica/.env.local) (Modificado, no versionado): apunta a `https://hagnzcajoovznixrqtoc.supabase.co` y usa las claves `publishable` y `secret` del proyecto cloud. Las claves no se registran en este documento.

### 4. Verificacion Realizada
- `npx supabase db push --dry-run`: "Remote database is up to date" (sin migraciones pendientes).
- Consultas REST directas con la clave publica:
  - `categorias`: `200`, 4 filas.
  - `ciudades`: `200`, 3 filas.
  - `tipos_organizacion`: `200`, 6 filas.
  - `publicaciones`: `200`, 0 filas.
  - `organizaciones`: `200`, 4 filas.
  - `guias_salud`: `200`, 5 filas.
- Servidor de produccion local (`next start --port 3050`):
  - `/`: `200`.
  - `/comunidad`: `200`.
  - `/directorio`: `200`.
  - `/salud`: `200`.
  - `/admin`: `200`.
  - `GET /api/publicaciones`: `200`, `fuente: "supabase"`, 0 publicaciones.
  - `GET /api/organizaciones`: `200`, `fuente: "supabase"`, 4 organizaciones.
  - `GET /api/guias-salud`: `200`, `fuente: "supabase"`, 5 guias.
  - `GET /api/admin/organizaciones`: `200` con sesion de administrador, 4 organizaciones.
  - `GET /api/admin/guias`: `200` con sesion de administrador, 5 guias.
  - `GET /api/admin/moderacion`: `200` con sesion de administrador, 0 reportes.
- No se mostro el aviso de "Modo de respaldo"; las APIs devolvieron `fuente: "supabase"`.
- `npm run lint`: Exito (0 advertencias, 0 errores).
- `npm run typecheck`: Exito (TypeScript compila sin errores).
- `npm run build`: Exito (build de produccion Next.js 16 con Turbopack).

### 5. Observaciones
- `publicaciones` quedo vacia porque `seed.sql` no carga publicaciones de ejemplo; se llenara con los aportes ciudadanos o con contenido administrativo.
- La cookie de administracion se marca `Secure` en produccion; sobre HTTP local el navegador puede no enviarla, pero sobre HTTPS funciona correctamente.
- Las migraciones existentes no se modificaron. Cualquier cambio futuro de esquema debe crear una nueva migracion `00014_...`.


