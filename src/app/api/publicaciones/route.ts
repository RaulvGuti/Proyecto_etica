import { NextResponse } from "next/server";
import { createPublicServerClient } from "@/lib/supabase/server";
import { CATEGORIAS_INICIALES, PUBLICACIONES_INICIALES } from "@/lib/initialData";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createPublicServerClient();
    const [respuestaPublicaciones, respuestaCategorias] = await Promise.all([
      supabase
        .from("publicaciones")
        .select("*, categoria:categorias(*)")
        .neq("estado", "oculto")
        .is("eliminado_en", null)
        .order("creado_en", { ascending: false })
        .retry(false),
      supabase
        .from("categorias")
        .select("*")
        .order("id", { ascending: true })
        .retry(false),
    ]);

    if (respuestaPublicaciones.error) {
      return NextResponse.json({
        publicaciones: PUBLICACIONES_INICIALES,
        categorias: CATEGORIAS_INICIALES,
        fuente: "respaldo_local",
        advertencia:
          "No se pudo consultar Supabase. Se muestran publicaciones y categorías de respaldo.",
      });
    }

    return NextResponse.json({
      publicaciones: respuestaPublicaciones.data ?? [],
      categorias: respuestaCategorias.data ?? CATEGORIAS_INICIALES,
      fuente: "supabase",
    });
  } catch {
    return NextResponse.json({
      publicaciones: PUBLICACIONES_INICIALES,
      categorias: CATEGORIAS_INICIALES,
      fuente: "respaldo_local",
      advertencia:
        "Supabase no está disponible. Se muestran publicaciones y categorías de respaldo.",
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categoria_id, alias_mostrado, texto, anonimo } = body;

    if (!texto || texto.trim().length === 0 || texto.trim().length > 2000) {
      return NextResponse.json(
        { error: "El texto debe tener entre 1 y 2000 caracteres." },
        { status: 400 }
      );
    }

    if (!categoria_id) {
      return NextResponse.json(
        { error: "La categoría es obligatoria." },
        { status: 400 }
      );
    }

    const supabase = createPublicServerClient();
    const aliasFinal = anonimo
      ? "Anónimo"
      : alias_mostrado?.trim() || "Caminante";

    const { data, error } = await supabase
      .from("publicaciones")
      .insert({
        categoria_id: Number(categoria_id),
        alias_mostrado: aliasFinal,
        texto: texto.trim(),
        anonimo: Boolean(anonimo),
        estado: "visible",
      })
      .select("*, categoria:categorias(*)")
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: "No se pudo guardar la publicación en Supabase.",
          detalle: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, publicacion: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json(
      {
        error: "No se pudo conectar con Supabase para guardar la publicación.",
        detalle: msg,
      },
      { status: 500 }
    );
  }
}
