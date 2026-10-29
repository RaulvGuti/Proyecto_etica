"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  GUIAS_SALUD_DB_INICIALES,
  ORGANIZACIONES_INICIALES,
  REPORTES_INICIALES,
  CIUDADES_INICIALES,
  TIPOS_ORGANIZACION_INICIALES,
} from "@/lib/initialData";
import {
  GuiaSalud,
  OrganizacionConDetalles,
  ReporteConPublicacion,
  Ciudad,
  TipoOrganizacion,
} from "@/types/database";


export default function AdminPage() {
  const [tabActiva, setTabActiva] = useState<"salud" | "comunidad" | "directorio">("comunidad");
  const [mensajeNotificacion, setMensajeNotificacion] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  // ==========================================
  // ESTADO: COMUNIDAD Y REPORTES
  // ==========================================
  const [reportes, setReportes] = useState<ReporteConPublicacion[]>(REPORTES_INICIALES);
  const [filtroEstadoReporte, setFiltroEstadoReporte] = useState<string>("pendiente");

  // ==========================================
  // ESTADO: SALUD Y AUTOCUIDADO
  // ==========================================
  const [guias, setGuias] = useState<GuiaSalud[]>(GUIAS_SALUD_DB_INICIALES);
  const [formGuia, setFormGuia] = useState({
    titulo: "",
    slug: "",
    categoria: "pies" as GuiaSalud["categoria"],
    resumen: "",
    instruccionesRaw: "",
    alerta_medica: "",
    orden: 1,
  });
  const [guardandoGuia, setGuardandoGuia] = useState(false);

  // ==========================================
  // ESTADO: DIRECTORIO
  // ==========================================
  const [organizaciones, setOrganizaciones] = useState<OrganizacionConDetalles[]>(ORGANIZACIONES_INICIALES);
  const [ciudades] = useState<Ciudad[]>(CIUDADES_INICIALES);
  const [tipos] = useState<TipoOrganizacion[]>(TIPOS_ORGANIZACION_INICIALES);
  const [formOrg, setFormOrg] = useState({
    nombre: "",
    ciudad_id: 1,
    tipo_id: 1,
    telefono: "",
    sitio_web: "",
    nota: "",
    verificado: true,
  });
  const [guardandoOrg, setGuardandoOrg] = useState(false);

  // Carga inicial sincronizada con Supabase
  useEffect(() => {
    async function sincronizarAdmin() {
      try {
        const supabase = createClient();

        // 1. Cargar reportes con sus publicaciones
        const { data: dataReportes, error: errReportes } = await supabase
          .from("reportes")
          .select("*, publicacion:publicaciones(*, categoria:categorias(*))")
          .order("creado_en", { ascending: false });

        if (!errReportes && dataReportes && dataReportes.length > 0) {
          setReportes(dataReportes as ReporteConPublicacion[]);
        }

        // 2. Cargar guías de salud
        const { data: dataGuias, error: errGuias } = await supabase
          .from("guias_salud")
          .select("*")
          .is("eliminado_en", null)
          .order("orden", { ascending: true });

        if (!errGuias && dataGuias && dataGuias.length > 0) {
          setGuias(dataGuias as GuiaSalud[]);
        }

        // 3. Cargar organizaciones
        const { data: dataOrgs, error: errOrgs } = await supabase
          .from("organizaciones")
          .select("*, ciudad:ciudades(*), tipo:tipos_organizacion(*)")
          .is("eliminado_en", null)
          .order("id", { ascending: false });

        if (!errOrgs && dataOrgs && dataOrgs.length > 0) {
          setOrganizaciones(dataOrgs as OrganizacionConDetalles[]);
        }
      } catch {
        // Modo offline / desarrollo local sin servidor Supabase activo
      }
    }

    sincronizarAdmin();
  }, []);

  function mostrarAviso(texto: string, tipo: "exito" | "error" = "exito") {
    setMensajeNotificacion({ tipo, texto });
    setTimeout(() => setMensajeNotificacion(null), 4500);
  }

  // ==========================================
  // ACCIONES DE MODERACIÓN DE REPORTES (COMUNIDAD)
  // ==========================================
  async function handleOcultarPublicacion(reporte: ReporteConPublicacion) {
    try {
      const supabase = createClient();

      // Ocultar publicación en la base de datos
      await supabase
        .from("publicaciones")
        .update({ estado: "oculto" })
        .eq("id", reporte.publicacion_id);

      // Marcar reporte como revisado
      await supabase
        .from("reportes")
        .update({ estado: "revisado" })
        .eq("id", reporte.id);
    } catch {
      // Ignorar error si offline
    }

    // Actualizar estado local reactivo
    setReportes((prev) =>
      prev.map((r) =>
        r.id === reporte.id
          ? {
              ...r,
              estado: "revisado",
              publicacion: r.publicacion ? { ...r.publicacion, estado: "oculto" } : null,
            }
          : r
      )
    );

    mostrarAviso(`Publicación #${reporte.publicacion_id} ocultada y retirada del feed. Reporte resuelto.`);
  }

  async function handleDescartarReporte(reporteId: number) {
    try {
      const supabase = createClient();
      await supabase
        .from("reportes")
        .update({ estado: "descartado" })
        .eq("id", reporteId);
    } catch {
      // Ignorar error si offline
    }

    setReportes((prev) =>
      prev.map((r) => (r.id === reporteId ? { ...r, estado: "descartado" } : r))
    );

    mostrarAviso("Reporte descartado. La publicación permanece visible.");
  }

  // ==========================================
  // ACCIONES DE SALUD Y AUTOCUIDADO
  // ==========================================
  async function handleSubmitGuia(e: React.FormEvent) {
    e.preventDefault();
    if (!formGuia.titulo.trim() || !formGuia.resumen.trim()) return;

    setGuardandoGuia(true);
    const slugCalculado =
      formGuia.slug.trim() ||
      formGuia.titulo
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const instruccionesArray = formGuia.instruccionesRaw
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const nuevaGuia: GuiaSalud = {
      id: Date.now(),
      slug: slugCalculado,
      categoria: formGuia.categoria,
      titulo: formGuia.titulo.trim(),
      resumen: formGuia.resumen.trim(),
      instrucciones: instruccionesArray,
      alerta_medica: formGuia.alerta_medica.trim() || null,
      orden: Number(formGuia.orden) || 1,
      creado_por: null,
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
      eliminado_en: null,
    };

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("guias_salud")
        .insert({
          slug: slugCalculado,
          categoria: formGuia.categoria,
          titulo: formGuia.titulo.trim(),
          resumen: formGuia.resumen.trim(),
          instrucciones: instruccionesArray,
          alerta_medica: formGuia.alerta_medica.trim() || null,
          orden: Number(formGuia.orden) || 1,
        })
        .select()
        .single();

      if (!error && data) {
        setGuias([...guias, data as GuiaSalud]);
      } else {
        setGuias([...guias, nuevaGuia]);
      }
    } catch {
      setGuias([...guias, nuevaGuia]);
    } finally {
      setGuardandoGuia(false);
      setFormGuia({
        titulo: "",
        slug: "",
        categoria: "pies",
        resumen: "",
        instruccionesRaw: "",
        alerta_medica: "",
        orden: guias.length + 2,
      });
      mostrarAviso("¡Nueva guía de salud guardada y publicada exitosamente!");
    }
  }

  async function handleEliminarGuia(guiaId: number) {
    try {
      const supabase = createClient();
      await supabase
        .from("guias_salud")
        .update({ eliminado_en: new Date().toISOString() })
        .eq("id", guiaId);
    } catch {
      // Ignorar error si offline
    }

    setGuias((prev) => prev.filter((g) => g.id !== guiaId));
    mostrarAviso("Guía de salud retirada de la sección pública.");
  }

  // ==========================================
  // ACCIONES DE DIRECTORIO OFICIAL
  // ==========================================
  async function handleSubmitOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!formOrg.nombre.trim()) return;

    setGuardandoOrg(true);
    const ciudadObj = ciudades.find((c) => c.id === Number(formOrg.ciudad_id));
    const tipoObj = tipos.find((t) => t.id === Number(formOrg.tipo_id));

    const nuevaOrgLocal: OrganizacionConDetalles = {
      id: Date.now(),
      nombre: formOrg.nombre.trim(),
      ciudad_id: Number(formOrg.ciudad_id),
      tipo_id: Number(formOrg.tipo_id),
      telefono: formOrg.telefono.trim() || null,
      sitio_web: formOrg.sitio_web.trim() || null,
      nota: formOrg.nota.trim() || null,
      verificado: formOrg.verificado,
      creado_por: null,
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
      eliminado_en: null,
      ciudad: ciudadObj,
      tipo: tipoObj,
    };

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("organizaciones")
        .insert({
          nombre: formOrg.nombre.trim(),
          ciudad_id: Number(formOrg.ciudad_id),
          tipo_id: Number(formOrg.tipo_id),
          telefono: formOrg.telefono.trim() || null,
          sitio_web: formOrg.sitio_web.trim() || null,
          nota: formOrg.nota.trim() || null,
          verificado: formOrg.verificado,
        })
        .select("*, ciudad:ciudades(*), tipo:tipos_organizacion(*)")
        .single();

      if (!error && data) {
        setOrganizaciones([data as OrganizacionConDetalles, ...organizaciones]);
      } else {
        setOrganizaciones([nuevaOrgLocal, ...organizaciones]);
      }
    } catch {
      setOrganizaciones([nuevaOrgLocal, ...organizaciones]);
    } finally {
      setGuardandoOrg(false);
      setFormOrg({
        nombre: "",
        ciudad_id: 1,
        tipo_id: 1,
        telefono: "",
        sitio_web: "",
        nota: "",
        verificado: true,
      });
      mostrarAviso("¡Organización añadida oficialmente al directorio público!");
    }
  }

  async function handleToggleVerificacionOrg(org: OrganizacionConDetalles) {
    const nuevoEstado = !org.verificado;
    try {
      const supabase = createClient();
      await supabase
        .from("organizaciones")
        .update({ verificado: nuevoEstado })
        .eq("id", org.id);
    } catch {
      // Ignorar si offline
    }

    setOrganizaciones((prev) =>
      prev.map((o) => (o.id === org.id ? { ...o, verificado: nuevoEstado } : o))
    );
    mostrarAviso(`Organización ${nuevoEstado ? "verificada" : "desmarcada"}.`);
  }

  async function handleEliminarOrg(orgId: number) {
    try {
      const supabase = createClient();
      await supabase
        .from("organizaciones")
        .update({ eliminado_en: new Date().toISOString() })
        .eq("id", orgId);
    } catch {
      // Ignorar si offline
    }

    setOrganizaciones((prev) => prev.filter((o) => o.id !== orgId));
    mostrarAviso("Organización dada de baja del directorio.");
  }

  // Filtrado de reportes
  const reportesFiltrados = reportes.filter((r) => {
    if (filtroEstadoReporte === "todos") return true;
    return r.estado === filtroEstadoReporte;
  });

  return (
    <main className="page-container">
      {/* Encabezado Principal de Administración */}
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <div style={{ marginBottom: "10px" }}>
              <span className="admin-badge">🛡️ Panel Unificado de Administración</span>
            </div>
            <h1 className="page-title">Centro de Gestión y Moderación</h1>
            <p className="page-desc">
              Control de contenidos de salud, moderación ética de publicaciones comunitarias
              y administración exclusiva del directorio oficial de recursos.
            </p>
          </div>
        </div>

        {mensajeNotificacion && (
          <div
            style={{
              background: mensajeNotificacion.tipo === "exito" ? "#E8F4EC" : "#FEE2E2",
              border: `1px solid ${mensajeNotificacion.tipo === "exito" ? "#C2E2CC" : "#FECACA"}`,
              color: mensajeNotificacion.tipo === "exito" ? "#1E6B39" : "#991B1B",
              padding: "12px 18px",
              borderRadius: "var(--radius)",
              marginTop: "16px",
              fontWeight: 500,
            }}
          >
            {mensajeNotificacion.texto}
          </div>
        )}
      </header>

      {/* Pestañas de Navegación del Administrador */}
      <nav className="admin-nav-tabs">
        <button
          type="button"
          className={`admin-tab-btn ${tabActiva === "comunidad" ? "active" : ""}`}
          onClick={() => setTabActiva("comunidad")}
        >
          💬 Moderación de Comunidad ({reportes.filter((r) => r.estado === "pendiente").length} pendientes)
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${tabActiva === "salud" ? "active" : ""}`}
          onClick={() => setTabActiva("salud")}
        >
          🏥 Gestión de Salud y Autocuidado ({guias.length} guías)
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${tabActiva === "directorio" ? "active" : ""}`}
          onClick={() => setTabActiva("directorio")}
        >
          📍 Subir y Gestionar Directorio ({organizaciones.length} orgs)
        </button>
      </nav>

      {/* ========================================================= */}
      {/* SECCIÓN 1: MODERACIÓN DE COMUNIDAD Y REPORTES */}
      {/* ========================================================= */}
      {tabActiva === "comunidad" && (
        <section>
          <div className="filter-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--primary-dark)" }}>
                Bandeja de Reportes Éticos (según 00006_reportes.sql y 00008_rls_policies.sql):
              </div>
              <div className="chips-container">
                <button
                  type="button"
                  className={`filter-chip ${filtroEstadoReporte === "pendiente" ? "active" : ""}`}
                  onClick={() => setFiltroEstadoReporte("pendiente")}
                >
                  Pendientes ({reportes.filter((r) => r.estado === "pendiente").length})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${filtroEstadoReporte === "revisado" ? "active" : ""}`}
                  onClick={() => setFiltroEstadoReporte("revisado")}
                >
                  Resueltos ({reportes.filter((r) => r.estado === "revisado").length})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${filtroEstadoReporte === "descartado" ? "active" : ""}`}
                  onClick={() => setFiltroEstadoReporte("descartado")}
                >
                  Descartados ({reportes.filter((r) => r.estado === "descartado").length})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${filtroEstadoReporte === "todos" ? "active" : ""}`}
                  onClick={() => setFiltroEstadoReporte("todos")}
                >
                  Todos
                </button>
              </div>
            </div>
          </div>

          {reportesFiltrados.length === 0 ? (
            <div className="empty-state">
              <h4>No hay reportes en este estado</h4>
              <p>La comunidad se encuentra protegida y no hay denuncias pendientes de revisión.</p>
            </div>
          ) : (
            <div className="single-column-list">
              {reportesFiltrados.map((reporte) => {
                const pub = reporte.publicacion;
                const estaPendiente = reporte.estado === "pendiente";

                return (
                  <article key={reporte.id} className="admin-report-card">
                    <div className="card-top">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          className={`badge ${
                            reporte.estado === "pendiente"
                              ? "badge-pendiente"
                              : reporte.estado === "revisado"
                              ? "badge-revisado"
                              : "badge-descartado"
                          }`}
                        >
                          Reporte {reporte.estado}
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                          ID Reporte #{reporte.id} • Publicación #{reporte.publicacion_id}
                        </span>
                      </div>
                      <span className="card-meta">
                        {new Date(reporte.creado_en).toLocaleDateString("es-GT", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div style={{ margin: "10px 0" }}>
                      <strong style={{ color: "var(--danger)", fontSize: "0.92rem" }}>
                        Motivo de la denuncia:
                      </strong>
                      <p style={{ margin: "4px 0 0", color: "var(--ink)", fontWeight: 500 }}>
                        &quot;{reporte.motivo}&quot;
                      </p>
                    </div>

                    {/* Contenido de la publicación reportada */}
                    <div className="reported-content-box">
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <strong>
                          Autor denunciado: {pub ? pub.alias_mostrado : "Publicación"}
                          {pub?.anonimo ? " (Anónimo)" : ""}
                        </strong>
                        <span className="card-meta">
                          Estado actual en BD: <strong>{pub?.estado || "visible"}</strong>
                        </span>
                      </div>
                      <div style={{ fontStyle: "italic", color: "#3B433A" }}>
                        {pub ? pub.texto : "Contenido de la publicación cargado desde el esquema."}
                      </div>
                    </div>

                    {/* Acciones de Moderación */}
                    {estaPendiente && (
                      <div className="card-actions" style={{ marginTop: "12px" }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => handleDescartarReporte(reporte.id)}
                        >
                          ✓ Descartar denuncia (mantener pública)
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleOcultarPublicacion(reporte)}
                        >
                          🚫 Ocultar y retirar publicación del feed
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* SECCIÓN 2: GESTIÓN DE SALUD Y AUTOCUIDADO */}
      {/* ========================================================= */}
      {tabActiva === "salud" && (
        <section>
          {/* Formulario de Nueva Guía Médica */}
          <div className="content-card" style={{ marginBottom: "28px" }}>
            <div className="admin-card-header">
              <h3>➕ Publicar Nueva Guía o Información de Autocuidado</h3>
              <span className="badge badge-tipo">Migración 00011_guias_salud</span>
            </div>

            <form onSubmit={handleSubmitGuia}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="guia-titulo">
                    Título de la Guía:
                  </label>
                  <input
                    id="guia-titulo"
                    type="text"
                    className="form-input"
                    placeholder="Ej. Tratamiento de quemaduras solares y raspaduras"
                    value={formGuia.titulo}
                    onChange={(e) => setFormGuia({ ...formGuia, titulo: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="guia-categoria">
                    Categoría Médica:
                  </label>
                  <select
                    id="guia-categoria"
                    className="form-select-full"
                    value={formGuia.categoria}
                    onChange={(e) =>
                      setFormGuia({ ...formGuia, categoria: e.target.value as GuiaSalud["categoria"] })
                    }
                  >
                    <option value="pies">Cuidado de Pies y Ampollas</option>
                    <option value="hidratacion">Hidratación y Suero Casero</option>
                    <option value="calor">Golpe de Calor e Insolación</option>
                    <option value="emocional">Primeros Auxilios Emocionales</option>
                    <option value="mujeres">Mujeres, Gestantes e Infancia</option>
                    <option value="general">Salud Preventiva General</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="guia-resumen">
                  Resumen Breve (visible antes de desplegar):
                </label>
                <input
                  id="guia-resumen"
                  type="text"
                  className="form-input"
                  placeholder="Instrucciones rápidas para aliviar lesiones menores en el trayecto..."
                  value={formGuia.resumen}
                  onChange={(e) => setFormGuia({ ...formGuia, resumen: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="guia-instrucciones">
                  Pasos e Instrucciones Prácticas (un paso por cada línea):
                </label>
                <textarea
                  id="guia-instrucciones"
                  className="form-textarea"
                  rows={4}
                  placeholder="Lavar la zona con agua limpia potable&#10;No aplicar alcohol de 90° directamente&#10;Colocar gasa limpia sellada"
                  value={formGuia.instruccionesRaw}
                  onChange={(e) => setFormGuia({ ...formGuia, instruccionesRaw: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="guia-alerta">
                  Señal de Alarma Médica (opcional - recuadro de advertencia roja):
                </label>
                <input
                  id="guia-alerta"
                  type="text"
                  className="form-input"
                  placeholder="Ej. Si la herida supura pus, genera fiebre o no cicatriza en 48h, acudir a Cruz Roja."
                  value={formGuia.alerta_medica}
                  onChange={(e) => setFormGuia({ ...formGuia, alerta_medica: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardandoGuia || !formGuia.titulo.trim()}
                >
                  {guardandoGuia ? "Guardando en BD..." : "Publicar Guía de Salud"}
                </button>
              </div>
            </form>
          </div>

          {/* Listado de Guías Publicadas */}
          <div className="content-card">
            <div className="admin-card-header">
              <h3>Guías de Salud Actualmente Visibles</h3>
              <span className="card-meta">{guias.length} guías registradas</span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Categoría</th>
                    <th>Instrucciones</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {guias.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <strong>{g.titulo}</strong>
                        <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{g.resumen}</div>
                      </td>
                      <td>
                        <span className="badge badge-tipo">{g.categoria}</span>
                      </td>
                      <td>{g.instrucciones.length} pasos</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleEliminarGuia(g.id)}
                        >
                          Dar de baja
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* SECCIÓN 3: SUBIR Y GESTIONAR DIRECTORIO OFICIAL */}
      {/* ========================================================= */}
      {tabActiva === "directorio" && (
        <section>
          {/* Formulario de Nueva Organización */}
          <div className="content-card" style={{ marginBottom: "28px" }}>
            <div className="admin-card-header">
              <h3>➕ Registrar Punto de Apoyo Oficial en el Directorio</h3>
              <span className="badge badge-verificado">Exclusivo de Administrador</span>
            </div>

            <form onSubmit={handleSubmitOrg}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="org-nombre">
                    Nombre del Centro u Organización:
                  </label>
                  <input
                    id="org-nombre"
                    type="text"
                    className="form-input"
                    placeholder="Ej. Casa del Migrante Santa Rosa"
                    value={formOrg.nombre}
                    onChange={(e) => setFormOrg({ ...formOrg, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="org-tipo">
                    Tipo de Servicio:
                  </label>
                  <select
                    id="org-tipo"
                    className="form-select-full"
                    value={formOrg.tipo_id}
                    onChange={(e) => setFormOrg({ ...formOrg, tipo_id: Number(e.target.value) })}
                  >
                    {tipos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="org-ciudad">
                    Ciudad / Municipio:
                  </label>
                  <select
                    id="org-ciudad"
                    className="form-select-full"
                    value={formOrg.ciudad_id}
                    onChange={(e) => setFormOrg({ ...formOrg, ciudad_id: Number(e.target.value) })}
                  >
                    {ciudades.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.departamento})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="org-telefono">
                    Teléfono de Contacto Directo:
                  </label>
                  <input
                    id="org-telefono"
                    type="text"
                    className="form-input"
                    placeholder="Ej. 2230-1122"
                    value={formOrg.telefono}
                    onChange={(e) => setFormOrg({ ...formOrg, telefono: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="org-web">
                    Sitio Web Oficial (opcional):
                  </label>
                  <input
                    id="org-web"
                    type="url"
                    className="form-input"
                    placeholder="https://..."
                    value={formOrg.sitio_web}
                    onChange={(e) => setFormOrg({ ...formOrg, sitio_web: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="org-nota">
                  Dirección y Servicios Detallados:
                </label>
                <textarea
                  id="org-nota"
                  className="form-textarea"
                  rows={3}
                  placeholder="Dirección exacta, capacidad de camas, raciones de comida y asesoría legal..."
                  value={formOrg.nota}
                  onChange={(e) => setFormOrg({ ...formOrg, nota: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formOrg.verificado}
                    onChange={(e) => setFormOrg({ ...formOrg, verificado: e.target.checked })}
                  />
                  <span>
                    Marcar como <strong>Organización Oficialmente Verificada</strong> por Puente
                  </span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardandoOrg || !formOrg.nombre.trim()}
                >
                  {guardandoOrg ? "Guardando en Directorio..." : "Publicar en Directorio"}
                </button>
              </div>
            </form>
          </div>

          {/* Tabla de Gestión del Directorio */}
          <div className="content-card">
            <div className="admin-card-header">
              <h3>Puntos de Apoyo en el Directorio</h3>
              <span className="card-meta">{organizaciones.length} activas</span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Organización</th>
                    <th>Tipo</th>
                    <th>Ubicación</th>
                    <th>Teléfono</th>
                    <th>Verificado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {organizaciones.map((org) => (
                    <tr key={org.id}>
                      <td>
                        <strong>{org.nombre}</strong>
                        {org.nota && (
                          <div style={{ fontSize: "0.8rem", color: "var(--muted)", maxWidth: "300px" }}>
                            {org.nota}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-tipo">{org.tipo?.nombre || "General"}</span>
                      </td>
                      <td>{org.ciudad?.nombre ? `${org.ciudad.nombre}, ${org.ciudad.departamento}` : "Guatemala"}</td>
                      <td>
                        {org.telefono ? (
                          <a href={`tel:${org.telefono}`} style={{ fontWeight: 600 }}>
                            {org.telefono}
                          </a>
                        ) : (
                          <span style={{ color: "var(--muted)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`badge ${org.verificado ? "badge-verificado" : "badge-tipo"}`}
                          style={{ cursor: "pointer", border: "1px solid var(--line)" }}
                          onClick={() => handleToggleVerificacionOrg(org)}
                          title="Hacer clic para cambiar estado de verificación"
                        >
                          {org.verificado ? "✓ Verificado" : "Pendiente"}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleEliminarOrg(org.id)}
                        >
                          Dar de baja
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
