## Descripcion

<!-- Que hace este PR y por que razon (en espanol) -->

## Cambios realizados

- 

## Issues relacionados

Closes #

## Tipo de cambio

- [ ] Feature (nueva funcionalidad)
- [ ] Fix (correccion de error)
- [ ] Security (cierra una vulnerabilidad o exposicion de datos)
- [ ] Refactor (sin cambio de comportamiento)
- [ ] Perf (rendimiento)
- [ ] Docs (documentacion)
- [ ] Chore (dependencias, configuracion, tooling)

## Como probar

1. 
2. 

## Checklist de verificacion local

- [ ] Las comprobaciones locales pasan (`npm run lint && npm run typecheck && npm run build`)
- [ ] Se agregaron pruebas si aplica
- [ ] Se actualizo la documentacion en `docs/` y se registro el cambio en `docs/BITACORA_CAMBIOS.md` si aplica
- [ ] No se incluyen archivos prohibidos (.env, credenciales, dumps, etc.)
- [ ] No se usan datos reales ni credenciales privadas en pruebas ni capturas

## Checklist de seguridad (Supabase y Next.js)

<!-- Obligatorio si el PR toca autenticacion, RLS, base de datos o APIs -->

- [ ] Las consultas a Supabase respetan RLS (Row Level Security) y no exponen llaves con privilegios `service_role` al cliente
- [ ] El alcance de los datos sale del servidor, nunca de un parametro manipulable del cliente
- [ ] Ningun dato que viaje al cliente incluye hashes, tokens ni credenciales
- [ ] Si se agrego una migracion en `supabase/migrations/`, sigue la numeracion `NNNNN_nombre.sql` y no modifica migraciones existentes

## Notas de despliegue y base de datos

<!-- Cambios de esquema SQL, variables de entorno nuevas, politicas RLS -->
