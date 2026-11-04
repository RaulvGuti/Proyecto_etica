import { NextResponse } from "next/server";
import { createPublicServerClient } from "@/lib/supabase/server";
import {
  CIUDADES_INICIALES,
  ORGANIZACIONES_INICIALES,
  TIPOS_ORGANIZACION_INICIALES,
} from "@/lib/initialData";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createPublicServerClient();
    const [respuestaOrganizaciones, respuestaCiudades, respuestaTipos] =
      await Promise.all([
        supabase
          .from("organizaciones")
          .select("*, ciudad:ciudades(*), tipo:tipos_organizacion(*)")
          .is("eliminado_en", null)
          .order("verificado", { ascending: false })
          .order("id", { ascending: false })
          .retry(false),
        supabase
          .from("ciudades")
          .select("*")
          .order("nombre", { ascending: true })
          .retry(false),
        supabase
          .from("tipos_organizacion")
          .select("*")
          .order("id", { ascending: true })
          .retry(false),
      ]);

    if (respuestaOrganizaciones.error) {
      return NextResponse.json({
        organizaciones: ORGANIZACIONES_INICIALES,
        ciudades: CIUDADES_INICIALES,
        tipos: TIPOS_ORGANIZACION_INICIALES,
        fuente: "respaldo_local",
        advertencia:
          "No se pudo consultar Supabase. Se muestra el directorio de respaldo.",
      });
    }

    return NextResponse.json({
      organizaciones: respuestaOrganizaciones.data ?? [],
      ciudades: respuestaCiudades.data ?? CIUDADES_INICIALES,
      tipos: respuestaTipos.data ?? TIPOS_ORGANIZACION_INICIALES,
      fuente: "supabase",
    });
  } catch {
    return NextResponse.json({
      organizaciones: ORGANIZACIONES_INICIALES,
      ciudades: CIUDADES_INICIALES,
      tipos: TIPOS_ORGANIZACION_INICIALES,
      fuente: "respaldo_local",
      advertencia:
        "Supabase no está disponible. Se muestra el directorio de respaldo.",
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, ciudad_id, tipo_id, telefono, nota } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre de la organización es obligatorio." },
        { status: 400 }
      );
    }

    if (!ciudad_id || !tipo_id) {
      return NextResponse.json(
        { error: "La ciudad y el tipo de organización son requeridos." },
        { status: 400 }
      );
    }

    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from("organizaciones")
      .insert({
        nombre: nombre.trim(),
        ciudad_id: Number(ciudad_id),
        tipo_id: Number(tipo_id),
        telefono: telefono?.trim() || null,
        nota: nota?.trim() || null,
        verificado: false,
      })
      .select("*, ciudad:ciudades(*), tipo:tipos_organizacion(*)")
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: "No se pudo guardar la sugerencia en Supabase.",
          detalle: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mensaje: "Aporte recibido y guardado. Pendiente de verificación por moderación.",
      organizacion: data,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json(
      {
        error: "No se pudo conectar con Supabase para guardar la sugerencia.",
        detalle: msg,
      },
      { status: 500 }
    );
  }
}
