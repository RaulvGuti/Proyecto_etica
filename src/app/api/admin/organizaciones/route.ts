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
    const [respuestaOrganizaciones, respuestaCiudades, respuestaTipos] = await Promise.all([
      supabase
        .from("organizaciones")
        .select("*, ciudad:ciudades(*), tipo:tipos_organizacion(*)")
        .is("eliminado_en", null)
        .order("id", { ascending: false }),
      supabase.from("ciudades").select("*").order("nombre", { ascending: true }),
      supabase.from("tipos_organizacion").select("*").order("id", { ascending: true }),
    ]);

    if (respuestaOrganizaciones.error) {
      return NextResponse.json(
        { error: respuestaOrganizaciones.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      organizaciones: respuestaOrganizaciones.data ?? [],
      ciudades: respuestaCiudades.data ?? [],
      tipos: respuestaTipos.data ?? [],
    });
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
      nombre,
      ciudad_id,
      tipo_id,
      telefono,
      sitio_web,
      nota,
      verificado = true,
    } = body;

    if (!nombre || !ciudad_id || !tipo_id) {
      return NextResponse.json(
        { error: "Nombre, ciudad y tipo son obligatorios." },
        { status: 400 }
      );
    }

    const supabase = createAdminServerClient();
    const { data, error } = await supabase
      .from("organizaciones")
      .insert({
        nombre: nombre.trim(),
        ciudad_id: Number(ciudad_id),
        tipo_id: Number(tipo_id),
        telefono: telefono?.trim() || null,
        sitio_web: sitio_web?.trim() || null,
        nota: nota?.trim() || null,
        verificado: Boolean(verificado),
      })
      .select("*, ciudad:ciudades(*), tipo:tipos_organizacion(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, organizacion: data });
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
    const { id, verificado } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de organización no provisto." }, { status: 400 });
    }

    const supabase = createAdminServerClient();
    const { data, error } = await supabase
      .from("organizaciones")
      .update({ verificado: Boolean(verificado) })
      .eq("id", Number(id))
      .select("*, ciudad:ciudades(*), tipo:tipos_organizacion(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, organizacion: data });
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
      return NextResponse.json({ error: "ID de organización no provisto." }, { status: 400 });
    }

    const supabase = createAdminServerClient();
    const { error } = await supabase
      .from("organizaciones")
      .update({ eliminado_en: new Date().toISOString() })
      .eq("id", Number(id));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mensaje: `Organización #${id} dada de baja correctamente.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

