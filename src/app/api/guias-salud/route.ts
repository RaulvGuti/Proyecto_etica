import { NextResponse } from "next/server";
import { createPublicServerClient } from "@/lib/supabase/server";
import { GUIAS_SALUD_DB_INICIALES } from "@/lib/initialData";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from("guias_salud")
      .select("*")
      .is("eliminado_en", null)
      .order("orden", { ascending: true })
      .retry(false);

    if (error) {
      return NextResponse.json({
        guias: GUIAS_SALUD_DB_INICIALES,
        fuente: "respaldo_local",
        advertencia:
          "No se pudo consultar Supabase. Se muestran las guías de respaldo.",
      });
    }

    return NextResponse.json({
      guias: data ?? [],
      fuente: "supabase",
    });
  } catch {
    return NextResponse.json({
      guias: GUIAS_SALUD_DB_INICIALES,
      fuente: "respaldo_local",
      advertencia:
        "Supabase no está disponible. Se muestran las guías de respaldo.",
    });
  }
}
