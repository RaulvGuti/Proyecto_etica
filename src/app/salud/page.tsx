"use client";

import { useEffect, useState } from "react";
import {
  GUIAS_SALUD_DB_INICIALES,
  ORGANIZACIONES_INICIALES,
  CIUDADES_INICIALES,
} from "@/lib/initialData";
import { OrganizacionConDetalles, GuiaSalud, Ciudad } from "@/types/database";

export default function SaludPage() {
  const [organizacionesSalud, setOrganizacionesSalud] = useState<OrganizacionConDetalles[]>(
    ORGANIZACIONES_INICIALES.filter((org) => org.tipo?.nombre === "Salud" || org.tipo_id === 2)
  );
  const [guias, setGuias] = useState<GuiaSalud[]>(GUIAS_SALUD_DB_INICIALES);
  const [ciudades, setCiudades] = useState<Ciudad[]>(CIUDADES_INICIALES);
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<string>("todas");
  const [guiaAbierta, setGuiaAbierta] = useState<string>("cuidado-pies-ampollas");
  const [vistaActiva, setVistaActiva] = useState<"guias" | "puntos">("guias");
  const [avisoDatos, setAvisoDatos] = useState<string | null>(null);

  useEffect(() => {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 6000);

    async function cargarSaludPublica() {
      let aviso: string | null = null;
      let huboFallo = false;

      const [resOrganizaciones, resGuias] = await Promise.allSettled([
        fetch("/api/organizaciones", {
          signal: controlador.signal,
          cache: "no-store",
        }),
        fetch("/api/guias-salud", {
          signal: controlador.signal,
          cache: "no-store",
        }),
      ]);

      if (
        resOrganizaciones.status === "fulfilled" &&
        resOrganizaciones.value.ok
      ) {
        try {
          const json = await resOrganizaciones.value.json();
          if (Array.isArray(json.organizaciones)) {
            const soloSalud = (
              json.organizaciones as OrganizacionConDetalles[]
            ).filter((org) => org.tipo?.nombre === "Salud" || org.tipo_id === 2);
            if (soloSalud.length > 0) {
              setOrganizacionesSalud(soloSalud);
            }
          }
          if (Array.isArray(json.ciudades) && json.ciudades.length > 0) {
            setCiudades(json.ciudades as Ciudad[]);
          }
          if (typeof json.advertencia === "string") {
            aviso = json.advertencia;
          }
        } catch {
          huboFallo = true;
        }
      } else {
        huboFallo = true;
      }

      if (resGuias.status === "fulfilled" && resGuias.value.ok) {
        try {
          const json = await resGuias.value.json();
          if (Array.isArray(json.guias) && json.guias.length > 0) {
            setGuias(json.guias as GuiaSalud[]);
          }
          if (typeof json.advertencia === "string") {
            aviso = json.advertencia;
          }
        } catch {
          huboFallo = true;
        }
      } else {
        huboFallo = true;
      }

      setAvisoDatos(
        aviso ??
          (huboFallo
            ? "No se pudo conectar con el servidor. Se muestra información de respaldo."
            : null)
      );
      clearTimeout(temporizador);
    }

    cargarSaludPublica();

    return () => {
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, []);


  const organizacionesFiltradas = organizacionesSalud.filter((org) => {
    if (ciudadSeleccionada === "todas") return true;
    return (
      org.ciudad?.nombre === ciudadSeleccionada ||
      org.ciudad?.departamento === ciudadSeleccionada
    );
  });

  return (
    <main className="page-container">
      {/* Encabezado */}
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Salud y Autocuidado</h1>
            <p className="page-desc">
              Información médica preventiva para la ruta, pautas de primeros auxilios y
              puntos de atención de salud gratuitos en Guatemala para personas en movilidad humana.
            </p>
          </div>
        </div>

        {/* Tarjeta de Emergencia Médica */}
        <div className="sos-card" style={{ marginTop: "16px" }}>
          <h3>Asistencia médica urgente (24 horas)</h3>
          <ul>
            <li>
              <span>Cruz Roja Guatemalteca (Ambulancia y atención de emergencia)</span>
              <a href="tel:125" className="phone-action">Llamar 125</a>
            </li>
            <li>
              <span>Bomberos Voluntarios (Urgencias y rescate)</span>
              <a href="tel:122" className="phone-action">Llamar 122</a>
            </li>
            <li>
              <span>Bomberos Municipales</span>
              <a href="tel:123" className="phone-action">Llamar 123</a>
            </li>
            <li>
              <span>Procuraduría de Derechos Humanos (PDH - Denuncias y apoyo en salud)</span>
              <a href="tel:1555" className="phone-action">Llamar 1555</a>
            </li>
          </ul>
        </div>
      </header>

      {avisoDatos && (
        <div className="safety-banner" role="status">
          <span>Aviso</span>
          <div>
            <strong>Modo de respaldo:</strong> {avisoDatos}
          </div>
        </div>
      )}

      {/* Selector de Pestañas */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        <button
          type="button"
          className={`filter-chip ${vistaActiva === "guias" ? "active" : ""}`}
          onClick={() => setVistaActiva("guias")}
          style={{ fontSize: "0.95rem", padding: "8px 18px" }}
        >
          📖 Guías de Autocuidado en Ruta
        </button>
        <button
          type="button"
          className={`filter-chip ${vistaActiva === "puntos" ? "active" : ""}`}
          onClick={() => setVistaActiva("puntos")}
          style={{ fontSize: "0.95rem", padding: "8px 18px" }}
        >
          🏥 Puntos de Salud y Cruz Roja
        </button>
      </div>

      {/* VISTA 1: GUÍAS DE AUTOCUIDADO */}
      {vistaActiva === "guias" && (
        <section>
          <div className="safety-banner">
            <span>🛡️</span>
            <div>
              <strong>Derecho Humano a la Salud:</strong> En Guatemala, la atención de emergencia en
              hospitales nacionales y puestos de salud públicos es gratuita y por ley no te pueden exigir
              documentos migratorios ni denunciarte ante autoridades migratorias para atenderte.
            </div>
          </div>

          <div className="guides-container">
            {guias.map((guia: GuiaSalud) => {
              const estaAbierta = guiaAbierta === guia.slug;
              return (
                <article key={guia.id} className="guide-item">
                  <div
                    className="guide-header"
                    onClick={() => setGuiaAbierta(estaAbierta ? "" : guia.slug)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setGuiaAbierta(estaAbierta ? "" : guia.slug);
                      }
                    }}
                  >
                    <div>
                      <h2 className="guide-title">{guia.titulo}</h2>
                      <p className="guide-summary">{guia.resumen}</p>
                    </div>
                    <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--primary)" }}>
                      {estaAbierta ? "−" : "+"}
                    </span>
                  </div>

                  {estaAbierta && (
                    <div className="guide-body">
                      <ul className="guide-steps">
                        {guia.instrucciones.map((instruccion, idx) => (
                          <li key={idx}>{instruccion}</li>
                        ))}
                      </ul>

                      {guia.alerta_medica && (
                        <div className="guide-alert">
                          <strong>⚠️ Señal de Alarma Médica: </strong>
                          {guia.alerta_medica}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* VISTA 2: PUNTOS DE SALUD Y CRUZ ROJA */}
      {vistaActiva === "puntos" && (
        <section>
          <div className="filter-section">
            <div className="filter-row">
              <label htmlFor="ciudad-salud" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                Filtrar por Departamento / Ciudad:
              </label>
              <select
                id="ciudad-salud"
                className="select-box"
                value={ciudadSeleccionada}
                onChange={(e) => setCiudadSeleccionada(e.target.value)}
              >
                <option value="todas">Todas las ubicaciones</option>
                {ciudades.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.nombre} ({c.departamento})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {organizacionesFiltradas.length === 0 ? (
            <div className="empty-state">
              <h4>No se encontraron centros médicos en esta ubicación</h4>
              <p>Prueba seleccionando &quot;Todas las ubicaciones&quot; o llama a la Cruz Roja al 125.</p>
            </div>
          ) : (
            <div className="cards-grid">
              {organizacionesFiltradas.map((org) => (
                <article key={org.id} className="content-card">
                  <div className="card-top">
                    <span className="badge badge-tipo">Salud y Primeros Auxilios</span>
                    {org.verificado && (
                      <span className="badge badge-verificado" title="Verificado por el equipo de Puente">
                        ✓ Verificado
                      </span>
                    )}
                  </div>

                  <h2 className="card-title">{org.nombre}</h2>

                  <div className="card-location">
                    <span>📍</span>
                    <span>
                      {org.ciudad?.nombre ? `${org.ciudad.nombre}, ${org.ciudad.departamento}` : "Guatemala"}
                    </span>
                  </div>

                  {org.nota && <p className="card-text">{org.nota}</p>}

                  <div className="card-actions">
                    {org.telefono ? (
                      <a href={`tel:${org.telefono.replace(/[^0-9]/g, "")}`} className="phone-action">
                        📞 {org.telefono}
                      </a>
                    ) : (
                      <span className="card-meta">Sin teléfono directo</span>
                    )}

                    {org.sitio_web && (
                      <a
                        href={org.sitio_web}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                      >
                        Sitio web ↗
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
