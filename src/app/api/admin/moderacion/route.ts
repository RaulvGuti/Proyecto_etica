import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminAuth";
import { createAdminServerClient } from "@/lib/supabase/server";

export async function GET() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json(
      { error: "No autorizado. Inicie sesión en administración." },
      { status: 401 }
    );
  }

  try {
    const supabase = createAdminServerClient();
    const { data, error } = await supabase
      .from("reportes")
      .select("*, publicacion:publicaciones(*, categoria:categorias(*))")
      .order("creado_en", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reportes: data ?? [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json(
      { error: "No autorizado. Inicie sesión en administración." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { accion, reporteId, publicacionId } = body;

    const supabase = createAdminServerClient();

    if (accion === "ocultar" && publicacionId) {
      // 1. Ocultar la publicación
      const { error: errorPub } = await supabase
        .from("publicaciones")
        .update({ estado: "oculto" })
        .eq("id", publicacionId);

      if (errorPub) {
        return NextResponse.json({ error: errorPub.message }, { status: 500 });
      }

      // 2. Marcar reporte como revisado
      if (reporteId) {
        await supabase
          .from("reportes")
          .update({ estado: "revisado" })
          .eq("id", reporteId);
      }

      return NextResponse.json({
        success: true,
        mensaje: `Publicación #${publicacionId} ocultada del feed público.`,
      });
    }

    if (accion === "descartar" && reporteId) {
      const { error } = await supabase
        .from("reportes")
        .update({ estado: "descartado" })
        .eq("id", reporteId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        mensaje: `Reporte #${reporteId} descartado.`,
      });
    }

    if (accion === "revisado" && reporteId) {
      const { error } = await supabase
        .from("reportes")
        .update({ estado: "revisado" })
        .eq("id", reporteId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        mensaje: `Reporte #${reporteId} marcado como revisado.`,
      });
    }

    return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

