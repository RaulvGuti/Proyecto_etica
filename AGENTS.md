<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Puente (Proyecto_etica) - Directrices para Agentes de IA

Bienvenido al repositorio de **Puente**. Todo agente de IA que opere en este proyecto debe acatar las directrices descritas a continuacion y consultar la documentacion indexada.

## 📚 Indice del Directorio de Documentacion (`docs/`)

Toda la documentacion de gobernanza, historial y arquitectura reside en la carpeta [`docs/`](docs/):

1. [`docs/README.md`](docs/README.md): Indice general de documentacion del proyecto.
2. [`docs/BITACORA_CAMBIOS.md`](docs/BITACORA_CAMBIOS.md): **Bitacora acumulativa de intervenciones de IA**.
   - **REGLA MANDATORIA**: Nunca borres entradas anteriores. Todo agente debe agregar una nueva entrada al final describiendo fecha, archivos tocados, razon del cambio y comprobaciones realizadas.
3. [`docs/GUIA_WORKFLOWS_Y_CONVENCIONES.md`](docs/GUIA_WORKFLOWS_Y_CONVENCIONES.md): Guia oficial sobre:
   - Formato de Commits y titulos de PR en espanol (`feat(alcance): descripcion`, `fix(...)`, etc.).
   - Workflows automatizados de GitHub Actions (`validar-pr.yml`, `ci.yml`, `migraciones.yml`, `etiquetado.yml`).
   - Normas de inmutabilidad de migraciones en Supabase y politicas de Row Level Security (RLS).
   - Configuracion de `pre-commit` y deteccion de secretos.

---

## 🛠️ Reglas Operativas para Agentes en este Repositorio

1. **Idioma de Commits y PRs**:
   - Todo mensaje de commit, titulo de PR y descripcion tecnica debe redactarse en **espanol**.
   - Formato obligatorio: `<tipo>(<alcance>): <descripcion en espanol>`.

2. **Registro de Cambios Obligatorio**:
   - Cada vez que completes una tarea o serie de modificaciones en el codigo, **debes registrar una constancia detallada** en [`docs/BITACORA_CAMBIOS.md`](docs/BITACORA_CAMBIOS.md).
   - No resumas de forma destructiva ni sobreescribas el historial previo.

3. **Verificacion de Calidad**:
   - Antes de concluir cualquier intervencion, asegurate de que los checks locales pasen:
     - `npm run lint`
     - `npm run typecheck`
     - `npm run build`

4. **Politica de Base de Datos (Supabase)**:
   - **Las migraciones son inmutables**: Nunca edites ni borres archivos existentes en `supabase/migrations/`.
   - Crea siempre una nueva migracion numerada siguiendo el patron `^[0-9]{5}_[a-z0-9_]+\.sql$`.
   - Garantiza politicas RLS restrictivas para toda tabla nueva y nunca expongas la clave `service_role` en el cliente.
