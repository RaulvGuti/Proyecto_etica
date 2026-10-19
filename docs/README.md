# Documentacion del Proyecto

Bienvenido al directorio de documentacion de **Puente** (`Proyecto_etica`).

Este repositorio cuenta con un sistema integral de gobernanza, workflows de GitHub Actions y pautas de desarrollo en espanol, respaldado por la arquitectura full-stack de **Next.js 16** y **Supabase (PostgreSQL)**.

## Indice de Documentos

1. [**Bitacora de Cambios Realizados por IA**](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/docs/BITACORA_CAMBIOS.md) (`BITACORA_CAMBIOS.md`):
   - Registro historico y acumulativo de todas las modificaciones efectuadas por agentes de IA.
   - **Regla estricta**: Nunca se eliminan entradas previas; cada nueva intervencion agrega su constancia al final.

2. [**Guia de Workflows, Commits y Convenciones**](file:///c:/Users/Usuario/Documents/GitHub/Proyecto_etica/docs/GUIA_WORKFLOWS_Y_CONVENCIONES.md) (`GUIA_WORKFLOWS_Y_CONVENCIONES.md`):
   - Formato de commits y PRs en espanol (Conventional Commits).
   - Explicacion de los workflows de CI/CD, validacion de PRs y migraciones.
   - Seguridad y RLS en Supabase.
   - Uso de etiquetas y plantillas de issues.

## Arquitectura y Stack Tecnologico

- **Frontend / Framework**: Next.js 16 (App Router), React 19, TypeScript.
- **Estilos**: Tailwind CSS v4, PostCSS, variables CSS personalizadas.
- **Base de Datos / Backend**: Supabase (PostgreSQL 15+) con RLS (Row Level Security), extensiones `uuid-ossp`, `pgcrypto`, triggers y migraciones numeradas en `supabase/migrations/`.
- **Calidad y Tooling**: ESLint 9, TypeScript 5, pre-commit con Gitleaks y validadores de sintaxis.
- **Gobernanza**: GitHub Actions con permisos minimos (`contents: read`), anclaje por SHA y Dependabot.
