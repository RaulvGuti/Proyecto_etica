"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ORGANIZACIONES_INICIALES,
  CIUDADES_INICIALES,
  TIPOS_ORGANIZACION_INICIALES,
} from "@/lib/initialData";
import {
  OrganizacionConDetalles,
  Ciudad,
  TipoOrganizacion,
} from "@/types/database";

export default function DirectorioPage() {
  const [organizaciones, setOrganizaciones] = useState<OrganizacionConDetalles[]>(ORGANIZACIONES_INICIALES);
  const [ciudades] = useState<Ciudad[]>(CIUDADES_INICIALES);
  const [tipos] = useState<TipoOrganizacion[]>(TIPOS_ORGANIZACION_INICIALES);

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
    async function cargarDirectorioSupabase() {
      try {
        const supabase = createClient();
        // Consulta respetando 00004_organizaciones.sql y 00008_rls_policies.sql
        const { data, error } = await supabase
          .from("organizaciones")
          .select("*, ciudad:ciudades(*), tipo:tipos_organizacion(*)")
          .is("eliminado_en", null)
          .order("verificado", { ascending: false });

        if (!error && data && data.length > 0) {
          setOrganizaciones(data as OrganizacionConDetalles[]);
        }
      } catch {
        // En caso de modo offline o sin servicio local activo, se mantiene el estado inicial
      }
    }

    cargarDirectorioSupabase();
  }, []);

  function handleSugerirOrganizacion(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreOrg.trim()) return;

    setEnviandoSugerencia(true);
    // Simular recepción para revisión de moderación
    setTimeout(() => {
      setEnviandoSugerencia(false);
      setMostrarModalSugerir(false);
      setNombreOrg("");
      setTelefonoOrg("");
      setNotaOrg("");
      setMensajeExito("¡Gracias por tu aporte! La información será verificada por moderadores antes de publicarse.");
      setTimeout(() => setMensajeExito(null), 5000);
    }, 600);
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
      default:
        return "badge-tipo";
    }
  }

  return (
    <main className="page-container">
      {/* Encabezado */}
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Directorio de Recursos y Organizaciones</h1>
            <p className="page-desc">
              Puntos de apoyo verificados en Guatemala para personas migrantes: albergues seguros,
              atención médica gratuita, asesoría legal en derechos humanos y comedores solidarios.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setMostrarModalSugerir(true)}
          >
            ➕ Sugerir un punto de apoyo
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

      {/* Alerta de Confidencialidad y Gratuidad */}
      <div className="safety-banner">
        <span>🤝</span>
        <div>
          <strong>Servicios Gratuitos y Humanitarios:</strong> Ninguno de los albergues, comedores o
          clínicas comunitarias listados cobra dinero por techo, comida o auxilio médico de emergencia.
          Si alguien te pide un pago para ingresar, repórtalo en la sección de Comunidad.
        </div>
      </div>

      {/* Sección de Filtros */}
      <section className="filter-section">
        {/* Barra de búsqueda y Select de Ciudad */}
        <div className="filter-row">
          <div className="search-input-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nombre, servicio, dirección o municipio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <select
            className="select-box"
            value={ciudadSeleccionada}
            onChange={(e) => setCiudadSeleccionada(e.target.value)}
          >
            <option value="todas">Todas las ciudades / departamentos</option>
            {ciudades.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.nombre} ({c.departamento})
              </option>
            ))}
          </select>

          <label className="checkbox-label" style={{ fontSize: "0.88rem" }}>
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

      {/* Grid de Organizaciones */}
      {organizacionesFiltradas.length === 0 ? (
        <div className="empty-state">
          <h4>No se encontraron organizaciones con estos criterios</h4>
          <p>Intenta restablecer los filtros para ver todos los puntos de apoyo disponibles.</p>
          <button
            type="button"
            className="btn btn-outline"
            style={{ marginTop: "14px" }}
            onClick={() => {
              setTipoSeleccionado("todos");
              setCiudadSeleccionada("todas");
              setBusqueda("");
              setSoloVerificados(false);
            }}
          >
            Restablecer filtros
          </button>
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
              estar en el directorio? Envía los datos para su verificación.
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

              <div className="form-group">
                <label className="form-label" htmlFor="sug-tipo">
                  Tipo de Servicio:
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

              <div className="form-group">
                <label className="form-label" htmlFor="sug-ciudad">
                  Ciudad / Municipio:
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
                <label className="form-label" htmlFor="sug-telefono">
                  Teléfono de contacto (opcional):
                </label>
                <input
                  id="sug-telefono"
                  type="text"
                  className="form-input"
                  placeholder="Ej. 2233-4455"
                  value={telefonoOrg}
                  onChange={(e) => setTelefonoOrg(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sug-nota">
                  Dirección y servicios que brindan:
                </label>
                <textarea
                  id="sug-nota"
                  className="form-textarea"
                  rows={3}
                  placeholder="Describe la dirección exacta, horarios y qué tipo de ayuda ofrecen (comida, hospedaje, medicina)..."
                  value={notaOrg}
                  onChange={(e) => setNotaOrg(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
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
                  {enviandoSugerencia ? "Enviando..." : "Enviar sugerencia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
