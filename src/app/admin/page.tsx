"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GuiaSalud,
  OrganizacionConDetalles,
  ReporteConPublicacion,
  Ciudad,
  TipoOrganizacion,
} from "@/types/database";

class ErrorAdmin extends Error {
  status: number;

  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.status = status;
  }
}

async function solicitarAdmin<T>(url: string, opciones?: RequestInit): Promise<T> {
  const respuesta = await fetch(url, {
    cache: "no-store",
    ...opciones,
  });
  const json = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new ErrorAdmin(
      json?.error || "No se pudo comunicar con el servidor de administración.",
      respuesta.status
    );
  }

  return json as T;
}

export default function AdminPage() {
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [autenticado, setAutenticado] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [credenciales, setCredenciales] = useState({ email: "admin@puente.org", password: "" });
  const [iniciandoSesion, setIniciandoSesion] = useState(false);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [tabActiva, setTabActiva] = useState<"salud" | "comunidad" | "directorio">("comunidad");
  const [mensajeNotificacion, setMensajeNotificacion] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  // ==========================================
  // ESTADO: COMUNIDAD Y REPORTES
  // ==========================================
  const [reportes, setReportes] = useState<ReporteConPublicacion[]>([]);
  const [filtroEstadoReporte, setFiltroEstadoReporte] = useState<string>("pendiente");

  // ==========================================
  // ESTADO: SALUD Y AUTOCUIDADO
  // ==========================================
  const [guias, setGuias] = useState<GuiaSalud[]>([]);
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
  const [organizaciones, setOrganizaciones] = useState<OrganizacionConDetalles[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [tipos, setTipos] = useState<TipoOrganizacion[]>([]);
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

  const mostrarAviso = useCallback((texto: string, tipo: "exito" | "error" = "exito") => {
    setMensajeNotificacion({ tipo, texto });
    window.setTimeout(() => setMensajeNotificacion(null), 4500);
  }, []);

  const cargarDatosAdmin = useCallback(async () => {
    setCargandoDatos(true);

    try {
      const [dataReportes, dataGuias, dataDirectorio] = await Promise.all([
        solicitarAdmin<{ reportes: ReporteConPublicacion[] }>("/api/admin/moderacion"),
        solicitarAdmin<{ guias: GuiaSalud[] }>("/api/admin/guias"),
        solicitarAdmin<{
          organizaciones: OrganizacionConDetalles[];
          ciudades: Ciudad[];
          tipos: TipoOrganizacion[];
        }>("/api/admin/organizaciones"),
      ]);

      setReportes(dataReportes.reportes ?? []);
      setGuias(dataGuias.guias ?? []);
      setOrganizaciones(dataDirectorio.organizaciones ?? []);
      setCiudades(dataDirectorio.ciudades ?? []);
      setTipos(dataDirectorio.tipos ?? []);
    } catch (err) {
      if (err instanceof ErrorAdmin && err.status === 401) {
        setAutenticado(false);
      }

      mostrarAviso(
        err instanceof Error ? err.message : "No se pudieron cargar los datos de administración.",
        "error"
      );
    } finally {
      setCargandoDatos(false);
    }
  }, [mostrarAviso]);

  useEffect(() => {
    let activo = true;

    async function verificarSesion() {
      try {
        const sesion = await solicitarAdmin<{
          authenticated: boolean;
          user?: { email: string };
        }>("/api/admin/auth");

        if (!activo) return;

        setAdminEmail(sesion.user?.email ?? "");
        setAutenticado(true);
        await cargarDatosAdmin();
      } catch (err) {
        if (!activo) return;

        setAutenticado(false);

        if (!(err instanceof ErrorAdmin && err.status === 401)) {
          mostrarAviso(
            err instanceof Error ? err.message : "No se pudo verificar la sesión.",
            "error"
          );
        }
      } finally {
        if (activo) setVerificandoSesion(false);
      }
    }

    verificarSesion();

    return () => {
      activo = false;
    };
  }, [cargarDatosAdmin, mostrarAviso]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIniciandoSesion(true);
    setErrorAuth(null);

    try {
      const sesion = await solicitarAdmin<{
        success: boolean;
        user: { email: string };
      }>("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credenciales),
      });

      setAdminEmail(sesion.user?.email ?? credenciales.email);
      setAutenticado(true);
      setCredenciales((prev) => ({ ...prev, password: "" }));
      await cargarDatosAdmin();
    } catch (err) {
      setErrorAuth(
        err instanceof Error ? err.message : "No se pudo iniciar sesión. Inténtalo de nuevo."
      );
    } finally {
      setIniciandoSesion(false);
    }
  }

  async function handleLogout() {
    try {
      await solicitarAdmin("/api/admin/auth", { method: "DELETE" });
    } catch {
      // La cookie se elimina en el servidor; limpiamos el estado local igualmente.
    } finally {
      setAutenticado(false);
      setAdminEmail("");
      setReportes([]);
      setGuias([]);
      setOrganizaciones([]);
      setCiudades([]);
      setTipos([]);
      setErrorAuth(null);
    }
  }

  function manejarErrorAccion(err: unknown, mensaje: string) {
    if (err instanceof ErrorAdmin && err.status === 401) {
      setAutenticado(false);
    }

    mostrarAviso(err instanceof Error ? err.message : mensaje, "error");
  }

  // ==========================================
  // ACCIONES DE MODERACIÓN DE REPORTES (COMUNIDAD)
  // ==========================================
  async function handleOcultarPublicacion(reporte: ReporteConPublicacion) {
    try {
      await solicitarAdmin("/api/admin/moderacion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "ocultar",
          reporteId: reporte.id,
          publicacionId: reporte.publicacion_id,
        }),
      });

      mostrarAviso(
        `Publicación #${reporte.publicacion_id} ocultada y retirada del feed. Reporte resuelto.`
      );
      await cargarDatosAdmin();
    } catch (err) {
      manejarErrorAccion(err, "No se pudo ocultar la publicación.");
    }
  }

  async function handleDescartarReporte(reporteId: number) {
    try {
      await solicitarAdmin("/api/admin/moderacion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "descartar", reporteId }),
      });

      mostrarAviso("Reporte descartado. La publicación permanece visible.");
      await cargarDatosAdmin();
    } catch (err) {
      manejarErrorAccion(err, "No se pudo descartar el reporte.");
    }
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

    try {
      await solicitarAdmin("/api/admin/guias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slugCalculado,
          categoria: formGuia.categoria,
          titulo: formGuia.titulo.trim(),
          resumen: formGuia.resumen.trim(),
          instrucciones: instruccionesArray,
          alerta_medica: formGuia.alerta_medica.trim() || null,
          orden: Number(formGuia.orden) || 1,
        }),
      });

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
      await cargarDatosAdmin();
    } catch (err) {
      manejarErrorAccion(err, "No se pudo guardar la guía de salud.");
    } finally {
      setGuardandoGuia(false);
    }
  }

  async function handleEliminarGuia(guiaId: number) {
    try {
      await solicitarAdmin(`/api/admin/guias?id=${guiaId}`, { method: "DELETE" });
      mostrarAviso("Guía de salud retirada de la sección pública.");
      await cargarDatosAdmin();
    } catch (err) {
      manejarErrorAccion(err, "No se pudo retirar la guía de salud.");
    }
  }

  // ==========================================
  // ACCIONES DE DIRECTORIO OFICIAL
  // ==========================================
  async function handleSubmitOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!formOrg.nombre.trim()) return;

    setGuardandoOrg(true);

    try {
      await solicitarAdmin("/api/admin/organizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formOrg.nombre.trim(),
          ciudad_id: Number(formOrg.ciudad_id),
          tipo_id: Number(formOrg.tipo_id),
          telefono: formOrg.telefono.trim() || null,
          sitio_web: formOrg.sitio_web.trim() || null,
          nota: formOrg.nota.trim() || null,
          verificado: formOrg.verificado,
        }),
      });

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
      await cargarDatosAdmin();
    } catch (err) {
      manejarErrorAccion(err, "No se pudo guardar la organización.");
    } finally {
      setGuardandoOrg(false);
    }
  }

  async function handleToggleVerificacionOrg(org: OrganizacionConDetalles) {
    const nuevoEstado = !org.verificado;

    try {
      await solicitarAdmin("/api/admin/organizaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: org.id, verificado: nuevoEstado }),
      });

      mostrarAviso(`Organización ${nuevoEstado ? "verificada" : "desmarcada"}.`);
      await cargarDatosAdmin();
    } catch (err) {
      manejarErrorAccion(err, "No se pudo actualizar la verificación.");
    }
  }

  async function handleEliminarOrg(orgId: number) {
    try {
      await solicitarAdmin(`/api/admin/organizaciones?id=${orgId}`, { method: "DELETE" });
      mostrarAviso("Organización dada de baja del directorio.");
      await cargarDatosAdmin();
    } catch (err) {
      manejarErrorAccion(err, "No se pudo dar de baja la organización.");
    }
  }

  // Filtrado de reportes
  const reportesFiltrados = reportes.filter((r) => {
    if (filtroEstadoReporte === "todos") return true;
    return r.estado === filtroEstadoReporte;
  });

  if (verificandoSesion) {
    return (
      <main className="page-container">
        <div className="loading-state-card" style={{ marginTop: "40px" }}>
          <div className="spinner" />
          <p>Verificando sesión de administración...</p>
        </div>
      </main>
    );
  }

  if (!autenticado) {
    return (
      <main className="page-container">
        <header className="page-header">
          <div className="page-header-top">
            <div>
              <div style={{ marginBottom: "10px" }}>
                <span className="admin-badge">🛡️ Acceso Restringido</span>
              </div>
              <h1 className="page-title">Administración de Puente</h1>
              <p className="page-desc">
                Inicia sesión para moderar la comunidad, gestionar guías de salud y administrar el
                directorio oficial de contactos.
              </p>
            </div>
          </div>
        </header>

        <section className="content-card" style={{ maxWidth: "520px", margin: "24px auto 0" }}>
          <div className="admin-card-header">
            <h3>Iniciar sesión</h3>
            <span className="badge badge-verificado">Solo personal autorizado</span>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-email">
                Correo o usuario:
              </label>
              <input
                id="admin-email"
                type="text"
                className="form-input"
                value={credenciales.email}
                onChange={(e) => setCredenciales({ ...credenciales, email: e.target.value })}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="admin-password">
                Contraseña:
              </label>
              <input
                id="admin-password"
                type="password"
                className="form-input"
                value={credenciales.password}
                onChange={(e) => setCredenciales({ ...credenciales, password: e.target.value })}
                autoComplete="current-password"
                required
              />
            </div>

            {errorAuth && (
              <p style={{ color: "var(--danger)", fontWeight: 600, margin: "0 0 12px" }}>
                {errorAuth}
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={iniciandoSesion || !credenciales.password.trim()}
              >
                {iniciandoSesion ? "Ingresando..." : "Ingresar al panel"}
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

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

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span className="card-meta">{adminEmail}</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
              Cerrar sesión
            </button>
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

      {cargandoDatos && (
        <p style={{ marginTop: "14px", color: "var(--muted)", fontSize: "0.9rem" }}>
          Sincronizando datos con Supabase...
        </p>
      )}

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
