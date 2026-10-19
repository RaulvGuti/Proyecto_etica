# Bitacora de Cambios (AI Agent Changelog)

> **REGLA FUNDAMENTAL DE MANTENIMIENTO:**
> Esta bitacora es **estrictamente acumulativa y permanente**.
> **NUNCA DEBEN ELIMINARSE REGISTROS PREVIOS**.
> Cualquier agente de IA o desarrollador que realice modificaciones en el repositorio debe dejar constancia de sus cambios agregando una nueva entrada cronologica al final de este archivo, especificando fecha, contexto, archivos tocados, decisiones arquitectonicas y comandos de verificacion.

---

## Indice de Entradas

- [Entrada 001 - 2026-10-19: Implementacion de Workflows de GitHub, Gobernanza en Espanol y Documentacion](#entrada-001---2026-10-19-implementacion-de-workflows-de-github-gobernanza-en-espanol-y-documentacion)

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
