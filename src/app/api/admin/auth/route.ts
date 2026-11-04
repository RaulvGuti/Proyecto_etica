import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_CONFIG, verifyAdminSession } from "@/lib/adminAuth";

export async function GET() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: { email: ADMIN_CONFIG.email, rol: "admin" },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const emailValido =
      email &&
      (email.trim().toLowerCase() === ADMIN_CONFIG.email.toLowerCase() ||
        email.trim().toLowerCase() === "admin");
    const passwordValido = password && password === ADMIN_CONFIG.password;

    if (!emailValido || !passwordValido) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Credenciales incorrectas. Acceso restringido exclusivamente a la cuenta de administración autorizada.",
        },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_CONFIG.cookieName, ADMIN_CONFIG.tokenSecretValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 horas
    });

    return NextResponse.json({
      success: true,
      user: { email: ADMIN_CONFIG.email, rol: "admin" },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al procesar la solicitud de autenticación." },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_CONFIG.cookieName);
  return NextResponse.json({ success: true });
}

