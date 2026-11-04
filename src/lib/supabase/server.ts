import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const TIEMPO_LIMITE_RED_MS = 5000

type FetchEntrada = Parameters<typeof fetch>[0]
type FetchOpciones = Parameters<typeof fetch>[1]

function obtenerConfiguracionSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

  return { supabaseUrl, supabaseKey }
}

function fetchConTiempoLimite(entrada: FetchEntrada, opciones?: FetchOpciones) {
  return fetch(entrada, {
    ...opciones,
    signal: opciones?.signal ?? AbortSignal.timeout(TIEMPO_LIMITE_RED_MS),
  })
}

export async function createClient() {
  const cookieStore = await cookies()
  const { supabaseUrl, supabaseKey } = obtenerConfiguracionSupabase()

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options))
      },
      global: {
        fetch: fetchConTiempoLimite,
      },
    }
  )
}

export function createPublicServerClient() {
  const { supabaseUrl, supabaseKey } = obtenerConfiguracionSupabase()

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: fetchConTiempoLimite,
    },
  })
}

/**
 * Cliente exclusivo de servidor con privilegios administrativos (service_role o respaldo local).
 * Utilizado únicamente en API Route Handlers protegidos en el servidor, nunca expuesto al cliente.
 */
export function createAdminServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_INTERNAL_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

  return createSupabaseClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
