import { NextResponse } from "next/server";
import { createPublicServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { publicacion_id, motivo } = body;

    if (!publicacion_id || !motivo || motivo.trim().length === 0) {
      return NextResponse.json(
        { error: "Publicación y motivo del reporte son obligatorios." },
        { status: 400 }
      );
    }

    if (motivo.trim().length > 500) {
      return NextResponse.json(
        { error: "El motivo no puede exceder 500 caracteres." },
        { status: 400 }
      );
    }

    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from("reportes")
      .insert({
        publicacion_id: Number(publicacion_id),
        motivo: motivo.trim(),
        estado: "pendiente",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: "No se pudo registrar el reporte en Supabase.",
          detalle: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mensaje: "Reporte registrado para moderación.",
      reporte: data,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json(
      {
        error: "No se pudo conectar con Supabase para registrar el reporte.",
        detalle: msg,
      },
      { status: 500 }
    );
  }
}
