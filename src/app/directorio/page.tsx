"use client";

import { useEffect, useState } from "react";
import {
  CIUDADES_INICIALES,
  ORGANIZACIONES_INICIALES,
  TIPOS_ORGANIZACION_INICIALES,
} from "@/lib/initialData";
import {
  OrganizacionConDetalles,
  Ciudad,
  TipoOrganizacion,
} from "@/types/database";

export default function DirectorioPage() {
  const [organizaciones, setOrganizaciones] = useState<OrganizacionConDetalles[]>(
    ORGANIZACIONES_INICIALES
  );
  const [ciudades, setCiudades] = useState<Ciudad[]>(CIUDADES_INICIALES);
  const [tipos, setTipos] = useState<TipoOrganizacion[]>(
    TIPOS_ORGANIZACION_INICIALES
  );
  const [cargando, setCargando] = useState<boolean>(true);
  const [avisoDatos, setAvisoDatos] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Filtros
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>("todos");
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState<string>("");
  const [soloVerificados, setSoloVerificados] = useState<boolean>(false);

  // Modal para sugerir organización
  const [mostrarModalSugerir, setMostrarModalSugerir] = useState<boolean>(false);
  const [nombreOrg, setNombreOrg] = useState<string>("");
  const [ciudadIdSugerida, setCiudadIdSugerida] = useState<number>(1);
  const [tipoIdSugerido, setTipoIdSugerido] = useState<number>(1);
  const [telefonoOrg, setTelefonoOrg] = useState<string>("");
  const [notaOrg, setNotaOrg] = useState<string>("");
  const [enviandoSugerencia, setEnviandoSugerencia] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  useEffect(() => {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 6000);

    async function cargarDirectorioPublico() {
      setCargando(true);
      try {
        const res = await fetch("/api/organizaciones", {
          signal: controlador.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("El servidor no devolvió una respuesta válida.");
        }

        const json = await res.json();

        if (Array.isArray(json.organizaciones)) {
          setOrganizaciones(json.organizaciones as OrganizacionConDetalles[]);
        }

        if (Array.isArray(json.ciudades) && json.ciudades.length > 0) {
          const ciudadesServidor = json.ciudades as Ciudad[];
          setCiudades(ciudadesServidor);
          setCiudadIdSugerida((actual) =>
            ciudadesServidor.some((ciudad) => ciudad.id === actual)
              ? actual
              : ciudadesServidor[0].id
          );
        }

        if (Array.isArray(json.tipos) && json.tipos.length > 0) {
          const tiposServidor = json.tipos as TipoOrganizacion[];
          setTipos(tiposServidor);
          setTipoIdSugerido((actual) =>
            tiposServidor.some((tipo) => tipo.id === actual)
              ? actual
              : tiposServidor[0].id
          );
        }

        setAvisoDatos(
          typeof json.advertencia === "string" ? json.advertencia : null
        );
      } catch {
        setAvisoDatos(
          "No se pudo conectar con el servidor. Se muestra el directorio de respaldo."
        );
      } finally {
        clearTimeout(temporizador);
        setCargando(false);
      }
    }

    cargarDirectorioPublico();

    return () => {
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, []);

  async function handleSugerirOrganizacion(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreOrg.trim()) return;

    setEnviandoSugerencia(true);
    setMensajeError(null);

    try {
      const res = await fetch("/api/organizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreOrg.trim(),
          ciudad_id: Number(ciudadIdSugerida),
          tipo_id: Number(tipoIdSugerido),
          telefono: telefonoOrg.trim() || null,
          nota: notaOrg.trim() || null,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof json.error === "string"
            ? json.error
            : "No se pudo guardar la sugerencia."
        );
      }

      if (json.organizacion) {
        setOrganizaciones((prev) => [
          json.organizacion as OrganizacionConDetalles,
          ...prev,
        ]);
      }

      setMostrarModalSugerir(false);
      setNombreOrg("");
      setTelefonoOrg("");
      setNotaOrg("");
      setMensajeExito(
        "¡Aporte recibido y guardado en la base de datos! Será revisado por moderación antes de certificarse."
      );
      setTimeout(() => setMensajeExito(null), 5000);
    } catch (err: unknown) {
      setMensajeError(
        err instanceof Error
          ? err.message
          : "No se pudo enviar la sugerencia. Intenta de nuevo."
      );
    } finally {
      setEnviandoSugerencia(false);
    }
  }

  // Filtrado compuesto
  const organizacionesFiltradas = organizaciones.filter((org) => {
    // Filtro por Tipo
    const coincideTipo =
      tipoSeleccionado === "todos"
        ? true
        : org.tipo?.nombre?.toLowerCase() === tipoSeleccionado.toLowerCase();

    // Filtro por Ciudad
    const coincideCiudad =
      ciudadSeleccionada === "todas"
        ? true
        : org.ciudad?.nombre === ciudadSeleccionada ||
          org.ciudad?.departamento === ciudadSeleccionada;

    // Filtro de Solo Verificados
    const coincideVerificado = soloVerificados ? org.verificado : true;

    // Filtro de Búsqueda de texto (nombre, notas, ciudad)
    const termino = busqueda.toLowerCase().trim();
    const coincideBusqueda =
      termino === ""
        ? true
        : org.nombre.toLowerCase().includes(termino) ||
          (org.nota && org.nota.toLowerCase().includes(termino)) ||
          (org.ciudad && org.ciudad.nombre.toLowerCase().includes(termino)) ||
          (org.ciudad && org.ciudad.departamento.toLowerCase().includes(termino));

    return coincideTipo && coincideCiudad && coincideVerificado && coincideBusqueda;
  });

  function getBadgeClassTipo(tipo?: string) {
    switch (tipo?.toLowerCase()) {
      case "albergue":
        return "badge-consejo";
      case "salud":
        return "badge-animo";
      case "legal":
        return "badge-pregunta";
      case "comedor":
        return "badge-alerta";
      default:
        return "badge-consejo";
    }
  }

  return (
    <main className="page-container">
      {/* Encabezado */}
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Directorio de Organizaciones y Albergues</h1>
            <p className="page-desc">
              Puntos de apoyo humanitario en Guatemala: albergues temporales, comedores solidarios,
              defensorías de derechos humanos y asesoría migratoria legal.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setMostrarModalSugerir(true)}
          >
            ➕ Sugerir un lugar de apoyo
          </button>
        </div>

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

      {avisoDatos && (
        <div className="safety-banner" role="status">
          <span>Aviso</span>
          <div>
            <strong>Modo de respaldo:</strong> {avisoDatos}
          </div>
        </div>
      )}

      {mensajeError && (
        <div
          role="alert"
          style={{
            background: "#FDECEC",
            border: "1px solid #F3C2C2",
            color: "#9B1C1C",
            padding: "12px 18px",
            borderRadius: "var(--radius)",
            marginTop: "16px",
            fontWeight: 500,
          }}
        >
          {mensajeError}
        </div>
      )}

      {/* Barra de Filtros */}
      <section className="filter-section">
        <div className="filter-row">
          <div className="search-input-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nombre, ciudad o servicio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="select-container">
            <select
              className="filter-select"
              value={ciudadSeleccionada}
              onChange={(e) => setCiudadSeleccionada(e.target.value)}
            >
              <option value="todas">Todas las ciudades</option>
              {ciudades.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre} ({c.departamento})
                </option>
              ))}
            </select>
          </div>

          <label className="checkbox-label" style={{ whiteSpace: "nowrap" }}>
            <input
              type="checkbox"
              checked={soloVerificados}
              onChange={(e) => setSoloVerificados(e.target.checked)}
            />
            <span>Solo verificados</span>
          </label>
        </div>

        {/* Chips de Tipos de Organización */}
        <div className="chips-container">
          <button
            type="button"
            className={`filter-chip ${tipoSeleccionado === "todos" ? "active" : ""}`}
            onClick={() => setTipoSeleccionado("todos")}
          >
            Todos ({organizaciones.length})
          </button>
          {tipos.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`filter-chip ${tipoSeleccionado === t.nombre ? "active" : ""}`}
              onClick={() => setTipoSeleccionado(t.nombre)}
            >
              {t.nombre === "Albergue" && "🏠 "}
              {t.nombre === "Salud" && "🏥 "}
              {t.nombre === "Legal" && "⚖️ "}
              {t.nombre === "Comedor" && "🍲 "}
              {t.nombre === "Orientación" && "🧭 "}
              {t.nombre === "Atención a retornados" && "🫂 "}
              {t.nombre}
            </button>
          ))}
        </div>
      </section>

      {/* Grid de Organizaciones / Estados */}
      {cargando ? (
        <div className="loading-state-card">
          <div className="spinner" />
          <p>Cargando directorio de organizaciones desde Supabase...</p>
        </div>
      ) : organizacionesFiltradas.length === 0 ? (
        <div className="empty-state-card">
          <h4>No se encontraron organizaciones con estos criterios</h4>
          <p>
            {busqueda || tipoSeleccionado !== "todos" || ciudadSeleccionada !== "todas" || soloVerificados
              ? "Prueba restableciendo los filtros para ver todos los puntos de acogida disponibles."
              : "Actualmente no hay organizaciones registradas en la base de datos."}
          </p>
          {(busqueda || tipoSeleccionado !== "todos" || ciudadSeleccionada !== "todas" || soloVerificados) && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ marginTop: "16px" }}
              onClick={() => {
                setTipoSeleccionado("todos");
                setCiudadSeleccionada("todas");
                setBusqueda("");
                setSoloVerificados(false);
              }}
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : (
        <div className="cards-grid">
          {organizacionesFiltradas.map((org) => {
            const tipoNombre = org.tipo?.nombre || "Apoyo Social";
            return (
              <article key={org.id} className="content-card">
                <div className="card-top">
                  <span className={`badge ${getBadgeClassTipo(tipoNombre)}`}>
                    {tipoNombre}
                  </span>
                  {org.verificado && (
                    <span
                      className="badge badge-verificado"
                      title="Verificado por el equipo de Puente y fuentes oficiales"
                    >
                      ✓ Verificado
                    </span>
                  )}
                </div>

                <h2 className="card-title">{org.nombre}</h2>

                <div className="card-location">
                  <span>📍</span>
                  <span>
                    {org.ciudad?.nombre
                      ? `${org.ciudad.nombre}, ${org.ciudad.departamento}`
                      : "Guatemala"}
                  </span>
                </div>

                {org.nota && <p className="card-text">{org.nota}</p>}

                <div className="card-actions">
                  {org.telefono ? (
                    <a
                      href={`tel:${org.telefono.replace(/[^0-9]/g, "")}`}
                      className="phone-action"
                    >
                      📞 {org.telefono}
                    </a>
                  ) : (
                    <span className="card-meta">Atención presencial</span>
                  )}

                  {org.sitio_web && (
                    <a
                      href={org.sitio_web}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      Sitio oficial ↗
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* MODAL: SUGERIR ORGANIZACIÓN O PUNTO DE APOYO */}
      {mostrarModalSugerir && (
        <div className="modal-overlay" onClick={() => setMostrarModalSugerir(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Sugerir un Punto de Apoyo</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setMostrarModalSugerir(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "16px" }}>
              ¿Conoces un albergue seguro, comedor, clínica humanitaria o defensoría que deba
              estar en el directorio? Envía los datos para su verificación en la base de datos.
            </p>

            <form onSubmit={handleSugerirOrganizacion}>
              <div className="form-group">
                <label className="form-label" htmlFor="sug-nombre">
                  Nombre del lugar u organización:
                </label>
                <input
                  id="sug-nombre"
                  type="text"
                  className="form-input"
                  placeholder="Ej. Casa de Acogida San Mateo"
                  value={nombreOrg}
                  onChange={(e) => setNombreOrg(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="sug-ciudad">
                    Ciudad / Ubicación:
                  </label>
                  <select
                    id="sug-ciudad"
                    className="form-select-full"
                    value={ciudadIdSugerida}
                    onChange={(e) => setCiudadIdSugerida(Number(e.target.value))}
                  >
                    {ciudades.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.departamento})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sug-tipo">
                    Tipo de Apoyo:
                  </label>
                  <select
                    id="sug-tipo"
                    className="form-select-full"
                    value={tipoIdSugerido}
                    onChange={(e) => setTipoIdSugerido(Number(e.target.value))}
                  >
                    {tipos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sug-tel">
                  Teléfono de contacto (opcional):
                </label>
                <input
                  id="sug-tel"
                  type="tel"
                  className="form-input"
                  placeholder="Ej. 2230-0000 o +502 ..."
                  value={telefonoOrg}
                  onChange={(e) => setTelefonoOrg(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sug-nota">
                  Información clave (dirección, horarios, requisitos):
                </label>
                <textarea
                  id="sug-nota"
                  className="form-textarea"
                  rows={3}
                  placeholder="Ej. Abierto de 8am a 6pm, entregan raciones de comida y asesoría básica..."
                  value={notaOrg}
                  onChange={(e) => setNotaOrg(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setMostrarModalSugerir(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={enviandoSugerencia || !nombreOrg.trim()}
                >
                  {enviandoSugerencia ? "Enviando aporte..." : "Enviar sugerencia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
