# Guia de Workflows, Commits y Convenciones

Esta guia establece el flujo de trabajo para el repositorio **Puente** (`Proyecto_etica`), detallando las reglas para mensajes de commit, creacion y validacion de Pull Requests (PRs), manejo de migraciones de base de datos y politicas de seguridad.

---

## 1. Convencion de Commits y Titulos de PR (en Espanol)

Tanto los mensajes de commit como los titulos de los Pull Requests deben seguir el estandar **Conventional Commits** y estar redactados en **espanol**. Esto garantiza un historial legible, genera notas de version automaticas y permite que el titulo del PR sirva de mensaje al hacer squash.

### 1.1 Estructura
```text
<tipo>(<alcance>): <descripcion en espanol>
```
- `<tipo>`: Tipo de cambio (obligatorio).
- `(<alcance>)`: Modulo o seccion tocada en minusculas (opcional pero muy recomendado).
- `<descripcion>`: Descripcion breve en tiempo presente o infinitivo, en minusculas y sin punto final.

### 1.2 Tipos Permitidos

| Tipo | Que representa | Ejemplo |
|---|---|---|
| `feat` | Nueva funcionalidad | `feat(auth): implementar registro con supabase` |
| `fix` | Correccion de un error | `fix(ui): corregir contraste en barra de navegacion` |
| `security` | Cierre de vulnerabilidad o ajuste de RLS | `security(supabase): restringir acceso anonimo en perfiles` |
| `refactor` | Cambio de codigo sin alterar la logica | `refactor(lib): reorganizar cliente de supabase para server components` |
| `perf` | Mejora de rendimiento | `perf(imagenes): optimizar carga de fuentes locales con next/font` |
| `test` | Incorporacion o arreglo de pruebas | `test(rls): agregar pruebas de insercion para organizaciones` |
| `docs` | Actualizacion o ampliacion de documentacion | `docs(readme): agregar guia de inicio con docker y supabase` |
| `chore` | Tareas de dependencias, configuracion o tooling | `chore(deps): actualizar dependencias de eslint y postcss` |
| `ci` | Modificaciones a workflows de GitHub Actions | `ci(workflows): ajustar timeout en validacion de migraciones` |
| `style` | Formato o espaciado que no altera el codigo | `style(css): formatear reglas de globals.css segun editorconfig` |

*(Tambien son aceptados en la validacion de PR alias en espanol como `caracteristica`, `correccion`, `arreglo`).*

### 1.3 Alcances Habituales en este Repositorio
- `supabase`: Esquema de base de datos, politicas RLS, triggers, extensiones o seed.
- `perfiles`: Modulo de perfiles de usuario, roles y datos personales.
- `organizaciones`: Modulo y directorio de organizaciones de ayuda migrante.
- `publicaciones`: Contenido informativo, publicaciones y comunidad.
- `reportes`: Formularios de alerta, emergencias y contactos de asistencia.
- `ui`: Componentes visuales (`src/components/`), layout y estilos generales.
- `infra`: Dependencias de npm, configuracion de Next.js, TypeScript o CI.

---

## 2. Flujo de Trabajo con Pull Requests

### 2.1 Creacion de Ramas
- `feat/nombre-en-espanol` (para nuevas funcionalidades)
- `fix/nombre-en-espanol` (para correccion de errores)
- `docs/nombre-en-espanol` (para documentacion)
- `refactor/nombre-en-espanol` (para refactorizaciones)

### 2.2 Proceso de PR
1. **Comprobacion Local Previa**:
   Antes de abrir o sincronizar el PR, ejecuta en local:
   ```bash
   npm run lint
   npm run typecheck
   npm run build
   ```
2. **Uso de la Plantilla de PR**:
   Al abrir el PR, GitHub cargara automaticamente [.github/pull_request_template.md](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.github/pull_request_template.md). Rellena las secciones de cambios, issues enlazadas (`Closes #123`) y las listas de verificacion tecnica y de seguridad.
3. **Validacion Automatizada**:
   - `Validar PR` (.github/workflows/validar-pr.yml):
     - Comprueba el titulo contra el patron de Conventional Commits.
     - Inspecciona el diff en busca de archivos prohibidos (.env con datos reales, certificados, claves privadas, bases de datos sqlite).
     - **Nota clave**: Las migraciones en `supabase/migrations/*.sql` y `supabase/seed.sql` estan expresamente exceptuadas.
   - `CI` (.github/workflows/ci.yml):
     - Instala dependencias con `npm ci` bajo Node.js 20.
     - Ejecuta `npm run lint`, `npm run typecheck` y `npm run build`.
   - `Migraciones` (.github/workflows/migraciones.yml):
     - Comprueba la inmutabilidad de migraciones existentes.
     - Valida la sintaxis e integridad del esquema levantando un entorno Supabase efimero.
   - `Etiquetado` (.github/workflows/etiquetado.yml):
     - Asigna automaticamente etiquetas de modulo (`module:...`) segun los archivos tocados.

---

## 3. Reglas Criticas de Base de Datos y Supabase

### 3.1 Inmutabilidad de Migraciones
**Una migracion que ya existe en `supabase/migrations/` NUNCA se modifica ni se borra.**
- Cada cambio en la base de datos debe hacerse mediante una **nueva migracion numerada** con el formato:
  `NNNNN_nombre_descriptivo.sql` (ej: `00011_agregar_telefono_a_organizaciones.sql`).
- Si por un caso excepcional se requiere editar una migracion en desarrollo que aun no ha salido a produccion, se debe agregar la etiqueta `migracion-editada-a-proposito` al Pull Request para habilitar el bypass controlado.

### 3.2 Seguridad y Row Level Security (RLS)
- Todas las tablas deben tener RLS activado (`ALTER TABLE tabla ENABLE ROW LEVEL SECURITY;`).
- Toda tabla debe contar con politicas explicitas para `SELECT`, `INSERT`, `UPDATE` y `DELETE`.
- Nunca utilices la clave `service_role` en el frontend (`client.ts`). Esta clave solo debe usarse en entornos protegidos de servidor y nunca exponerse al navegador.
- Los filtros de seguridad deben validarse siempre en el servidor y mediante politicas de PostgreSQL, nunca confiando ciegamente en parametros provenientes del cliente.

---

## 4. Configuracion de Pre-commit en Local

Para evitar que se introduzcan credenciales accidentales o errores de formato antes de hacer commit, se recomienda activar `pre-commit`:

```bash
# 1. Instalar pre-commit (si no esta instalado en el sistema)
pip install pre-commit
# o con chocolatey / brew:
# choco install pre-commit

# 2. Instalar los hooks de git en el repositorio
pre-commit install

# 3. (Opcional) Probar todos los archivos
pre-commit run --all-files
```

El archivo [.pre-commit-config.yaml](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/.pre-commit-config.yaml) incluye:
- Limpieza de espacios en blanco finales y formato EOF.
- Validacion de JSON y YAML.
- **Gitleaks**: Escaneo local de claves y tokens.
- Bloqueo de commits directos a `main`.
- Ejecucion automatica de `npm run lint`.
