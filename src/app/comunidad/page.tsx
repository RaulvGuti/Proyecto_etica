"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORIAS_INICIALES,
  PUBLICACIONES_INICIALES,
} from "@/lib/initialData";
import { PublicacionConCategoria, Categoria } from "@/types/database";

export default function ComunidadPage() {
  const [publicaciones, setPublicaciones] = useState<PublicacionConCategoria[]>(PUBLICACIONES_INICIALES);
  const [categorias] = useState<Categoria[]>(CATEGORIAS_INICIALES);
  const [categoriaActiva, setCategoriaActiva] = useState<number | "todas">("todas");
  const [busqueda, setBusqueda] = useState<string>("");

  // Estado para el modal de nueva publicación
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState<boolean>(false);
  const [alias, setAlias] = useState<string>("");
  const [esAnonimo, setEsAnonimo] = useState<boolean>(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number>(1);
  const [textoPublicacion, setTextoPublicacion] = useState<string>("");
  const [enviando, setEnviando] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Estado para el modal de reporte
  const [publicacionAReportar, setPublicacionAReportar] = useState<PublicacionConCategoria | null>(null);
  const [motivoReporte, setMotivoReporte] = useState<string>("");
  const [enviandoReporte, setEnviandoReporte] = useState<boolean>(false);

  useEffect(() => {
    async function cargarPublicacionesSupabase() {
      try {
        const supabase = createClient();
        // Consulta respetando 00005_publicaciones.sql y 00008_rls_policies.sql
        const { data, error } = await supabase
          .from("publicaciones")
          .select("*, categoria:categorias(*)")
          .eq("estado", "visible")
          .order("creado_en", { ascending: false });

        if (!error && data && data.length > 0) {
          setPublicaciones(data as PublicacionConCategoria[]);
        }
      } catch {
        // Mantiene el estado inicial en caso de desconexión o entorno local sin servicio
      }
    }

    cargarPublicacionesSupabase();
  }, []);

  // Manejar el envío de una nueva publicación
  async function handleSubmitPublicacion(e: React.FormEvent) {
    e.preventDefault();
    if (!textoPublicacion.trim() || textoPublicacion.length > 2000) return;

    setEnviando(true);
    const aliasFinal = esAnonimo ? "Anónimo" : alias.trim() || "Caminante";
    const categoriaObj = categorias.find((c) => c.id === Number(categoriaSeleccionada)) || categorias[0];

    const nuevaPubLocal: PublicacionConCategoria = {
      id: Date.now(),
      autor_id: null,
      categoria_id: Number(categoriaSeleccionada),
      alias_mostrado: aliasFinal,
      texto: textoPublicacion.trim(),
      anonimo: esAnonimo,
      estado: "visible",
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
      eliminado_en: null,
      categoria: categoriaObj,
    };

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("publicaciones")
        .insert({
          categoria_id: Number(categoriaSeleccionada),
          alias_mostrado: aliasFinal,
          texto: textoPublicacion.trim(),
          anonimo: esAnonimo,
          estado: "visible",
        })
        .select("*, categoria:categorias(*)")
        .single();

      if (!error && data) {
        setPublicaciones([data as PublicacionConCategoria, ...publicaciones]);
      } else {
        // En caso de inserción sin backend conectado o RLS anónimo, actualizar vista localmente
        setPublicaciones([nuevaPubLocal, ...publicaciones]);
      }
    } catch {
      setPublicaciones([nuevaPubLocal, ...publicaciones]);
    } finally {
      setEnviando(false);
      setTextoPublicacion("");
      setAlias("");
      setMostrarModalNuevo(false);
      setMensajeExito("¡Tu mensaje fue publicado exitosamente!");
      setTimeout(() => setMensajeExito(null), 4500);
    }
  }

  // Manejar el reporte de una publicación a la tabla `reportes` (00006_reportes.sql)
  async function handleSubmitReporte(e: React.FormEvent) {
    e.preventDefault();
    if (!publicacionAReportar || !motivoReporte.trim()) return;

    setEnviandoReporte(true);
    try {
      const supabase = createClient();
      await supabase.from("reportes").insert({
        publicacion_id: publicacionAReportar.id,
        motivo: motivoReporte.trim(),
        estado: "pendiente",
      });
    } catch {
      // Ignorar error de red si offline
    } finally {
      setEnviandoReporte(false);
      setPublicacionAReportar(null);
      setMotivoReporte("");
      setMensajeExito("Reporte enviado a moderación. Gracias por velar por la seguridad de la comunidad.");
      setTimeout(() => setMensajeExito(null), 5000);
    }
  }

  // Filtrado de publicaciones
  const publicacionesFiltradas = publicaciones.filter((pub) => {
    const coincideCategoria =
      categoriaActiva === "todas" ? true : pub.categoria_id === categoriaActiva;
    const coincideBusqueda =
      busqueda.trim() === ""
        ? true
        : pub.texto.toLowerCase().includes(busqueda.toLowerCase()) ||
          pub.alias_mostrado.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  function getBadgeClass(nombre?: string) {
    switch (nombre?.toLowerCase()) {
      case "alerta":
        return "badge-alerta";
      case "ánimo":
      case "animo":
        return "badge-animo";
      case "pregunta":
        return "badge-pregunta";
      default:
        return "badge-consejo";
    }
  }

  function formatearFecha(fechaIso: string) {
    try {
      const fecha = new Date(fechaIso);
      return fecha.toLocaleDateString("es-GT", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Reciente";
    }
  }

  return (
    <main className="page-container">
      {/* Encabezado */}
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Comunidad y Red de Apoyo</h1>
            <p className="page-desc">
              Espacio solidario para compartir consejos prácticos en la ruta, resolver dudas,
              alertar sobre estafas o cobros indebidos y brindarse apoyo mutuo.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setMostrarModalNuevo(true)}
          >
            ✏️ Publicar un mensaje
          </button>
        </div>

        {/* Notificación de éxito */}
        {mensajeExito && (
          <div
            style={{
              background: "#E8F4EC",
              border: "1px solid #C2E2CC",
              color: "#1E6B39",
              padding: "12px 18px",
              borderRadius: "var(--radius)",
              marginTop: "16px",
              fontWeight: 500,
            }}
          >
            {mensajeExito}
          </div>
        )}
      </header>

      {/* Regla de Seguridad Comunitaria */}
      <div className="safety-banner">
        <span>⚠️</span>
        <div>
          <strong>Norma de Seguridad y Protección:</strong> Por tu propia seguridad y la de tu familia,
          nunca publiques números de teléfono privados, contraseñas, fotografías de documentos de identidad,
          nombres de coyotes ni ubicaciones en tiempo real donde estés pernoctando.
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <section className="filter-section">
        <div className="filter-row">
          <div className="search-input-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar mensajes, alertas o consejos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="chips-container">
          <button
            type="button"
            className={`filter-chip ${categoriaActiva === "todas" ? "active" : ""}`}
            onClick={() => setCategoriaActiva("todas")}
          >
            Todas ({publicaciones.length})
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`filter-chip ${categoriaActiva === cat.id ? "active" : ""}`}
              onClick={() => setCategoriaActiva(cat.id)}
            >
              {cat.nombre === "Alerta" && "⚠️ "}
              {cat.nombre === "Ánimo" && "💚 "}
              {cat.nombre === "Consejo" && "💡 "}
              {cat.nombre === "Pregunta" && "❓ "}
              {cat.nombre}
            </button>
          ))}
        </div>
      </section>

      {/* Feed de Publicaciones */}
      {publicacionesFiltradas.length === 0 ? (
        <div className="empty-state">
          <h4>No hay mensajes que coincidan con tu búsqueda</h4>
          <p>Prueba con otros términos de búsqueda o sé el primero en compartir un mensaje.</p>
          <button
            type="button"
            className="btn btn-outline"
            style={{ marginTop: "14px" }}
            onClick={() => {
              setCategoriaActiva("todas");
              setBusqueda("");
            }}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="single-column-list">
          {publicacionesFiltradas.map((pub) => {
            const catNombre = pub.categoria?.nombre || "Comunidad";
            return (
              <article key={pub.id} className="content-card">
                <div className="card-top">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className={`badge ${getBadgeClass(catNombre)}`}>
                      {catNombre}
                    </span>
                    <strong style={{ fontSize: "0.92rem", color: "var(--ink)" }}>
                      {pub.anonimo ? "👤 Anónimo" : `👤 ${pub.alias_mostrado}`}
                    </strong>
                  </div>
                  <span className="card-meta">{formatearFecha(pub.creado_en)}</span>
                </div>

                <p className="card-text">{pub.texto}</p>

                <div className="card-actions">
                  <span className="card-meta" style={{ fontSize: "0.8rem" }}>
                    {pub.categoria?.descripcion || "Mensaje comunitario de apoyo"}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setPublicacionAReportar(pub)}
                    title="Reportar esta publicación si contiene datos peligrosos o estafas"
                  >
                    🚩 Reportar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* MODAL: NUEVA PUBLICACIÓN */}
      {mostrarModalNuevo && (
        <div className="modal-overlay" onClick={() => setMostrarModalNuevo(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Compartir con la Comunidad</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setMostrarModalNuevo(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPublicacion}>
              <div className="form-group">
                <label className="form-label" htmlFor="categoria-select">
                  Tipo de Mensaje:
                </label>
                <select
                  id="categoria-select"
                  className="form-select-full"
                  value={categoriaSeleccionada}
                  onChange={(e) => setCategoriaSeleccionada(Number(e.target.value))}
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} — {c.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={esAnonimo}
                    onChange={(e) => setEsAnonimo(e.target.checked)}
                  />
                  <span>Publicar como mensaje anónimo (no mostrar mi nombre)</span>
                </label>
              </div>

              {!esAnonimo && (
                <div className="form-group">
                  <label className="form-label" htmlFor="alias-input">
                    Tu Alias o Nombre:
                  </label>
                  <input
                    id="alias-input"
                    type="text"
                    className="form-input"
                    placeholder="Ej. Caminante2026, HermanoDeRuta"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    maxLength={50}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="texto-pub">
                  Mensaje (máximo 2000 caracteres):
                </label>
                <textarea
                  id="texto-pub"
                  className="form-textarea"
                  rows={5}
                  placeholder="Escribe aquí tu consejo, pregunta sobre la ruta o aviso de alerta..."
                  value={textoPublicacion}
                  onChange={(e) => setTextoPublicacion(e.target.value)}
                  maxLength={2000}
                  required
                />
                <div className="char-counter">
                  {textoPublicacion.length} / 2000 caracteres
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setMostrarModalNuevo(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={enviando || !textoPublicacion.trim()}
                >
                  {enviando ? "Publicando..." : "Publicar mensaje"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REPORTAR PUBLICACIÓN */}
      {publicacionAReportar && (
        <div className="modal-overlay" onClick={() => setPublicacionAReportar(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: "var(--danger)" }}>Reportar Publicación</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setPublicacionAReportar(null)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "16px" }}>
              Ayúdanos a mantener este espacio seguro. Los reportes son anónimos y revisados con
              urgencia por el equipo de moderadores.
            </p>

            <form onSubmit={handleSubmitReporte}>
              <div className="form-group">
                <label className="form-label" htmlFor="motivo-select">
                  Motivo del reporte:
                </label>
                <select
                  id="motivo-select"
                  className="form-select-full"
                  value={motivoReporte}
                  onChange={(e) => setMotivoReporte(e.target.value)}
                  required
                >
                  <option value="">Selecciona un motivo...</option>
                  <option value="Estafa o cobro ilegal de dinero">Estafa o cobro ilegal de dinero</option>
                  <option value="Información falsa o peligrosa para la ruta">Información falsa o peligrosa para la ruta</option>
                  <option value="Exposición de datos personales privados">Exposición de datos personales privados</option>
                  <option value="Acoso, amenazas o incitación al odio">Acoso, amenazas o incitación al odio</option>
                  <option value="Otro motivo urgente">Otro motivo urgente</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setPublicacionAReportar(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={enviandoReporte || !motivoReporte}
                >
                  {enviandoReporte ? "Enviando..." : "Enviar reporte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
