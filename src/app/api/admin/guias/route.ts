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
      .from("guias_salud")
      .select("*")
      .is("eliminado_en", null)
      .order("orden", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ guias: data ?? [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json(
      { error: "No autorizado. Inicie sesión en administración." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      slug,
      categoria,
      titulo,
      resumen,
      instrucciones,
      alerta_medica,
      orden,
    } = body;

    if (!titulo || !resumen || !slug || !categoria) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para la guía." },
        { status: 400 }
      );
    }

    const supabase = createAdminServerClient();
    const { data, error } = await supabase
      .from("guias_salud")
      .insert({
        slug: slug.trim(),
        categoria,
        titulo: titulo.trim(),
        resumen: resumen.trim(),
        instrucciones: Array.isArray(instrucciones) ? instrucciones : [],
        alerta_medica: alerta_medica?.trim() || null,
        orden: Number(orden) || 1,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, guia: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json(
      { error: "No autorizado. Inicie sesión en administración." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de guía no provisto." }, { status: 400 });
    }

    const supabase = createAdminServerClient();
    const { error } = await supabase
      .from("guias_salud")
      .update({ eliminado_en: new Date().toISOString() })
      .eq("id", Number(id));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mensaje: `Guía #${id} dada de baja correctamente.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

