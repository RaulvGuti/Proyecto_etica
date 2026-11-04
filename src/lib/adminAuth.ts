import { cookies } from "next/headers";

export const ADMIN_CONFIG = {
  email: process.env.ADMIN_EMAIL || "admin@puente.org",
  password: process.env.ADMIN_PASSWORD || "AdminPuente2026!",
  cookieName: "puente_admin_token",
  tokenSecretValue: "puente_admin_session_auth_v1_active",
};

/**
 * Valida si la petición actual posee una sesión válida de administrador.
 */
export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_CONFIG.cookieName)?.value;
  return token === ADMIN_CONFIG.tokenSecretValue;
}

