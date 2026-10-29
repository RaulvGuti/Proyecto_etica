import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="hero">
        <div>
          <h1>No estás caminando solo esta ruta.</h1>
          <p>
            Puente es un espacio hecho por y para personas migrantes: información
            de salud, una comunidad que se apoya mutuamente, y contactos de
            organizaciones que pueden ayudarte hoy.
          </p>
        </div>
        <div className="sos-card">
          <h3>Si estás en crisis ahora</h3>
          <ul>
            <li><span>Policía Nacional Civil</span><a href="tel:110"><strong>110</strong></a></li>
            <li><span>Bomberos Voluntarios</span><a href="tel:122"><strong>122</strong></a></li>
            <li><span>Cruz Roja Guatemalteca</span><a href="tel:125"><strong>125</strong></a></li>
            <li><span>Derechos Humanos (PDH)</span><a href="tel:1555"><strong>1555</strong></a></li>
          </ul>
        </div>
      </div>

      <section className="home-sections-grid">
        <Link href="/salud" className="home-section-card">
          <h2>🏥 Salud y Autocuidado</h2>
          <p>
            Primeros auxilios para la ruta, tratamiento de ampollas, preparación de suero casero y centros de salud y Cruz Roja gratuitos en Guatemala.
          </p>
          <span className="card-cta">Ver guías y puestos médicos →</span>
        </Link>

        <Link href="/comunidad" className="home-section-card">
          <h2>💬 Comunidad y Red de Apoyo</h2>
          <p>
            Espacio seguro para compartir alertas sobre la ruta, resolver dudas de viaje, pedir orientación y enviarse palabras de aliento solidario.
          </p>
          <span className="card-cta">Entrar a la comunidad →</span>
        </Link>

        <Link href="/directorio" className="home-section-card">
          <h2>📍 Directorio de Organizaciones</h2>
          <p>
            Puntos verificados de acogida humanitaria: albergues temporales, asesoría legal en derechos humanos y comedores solidarios en Guatemala.
          </p>
          <span className="card-cta">Explorar directorio →</span>
        </Link>
      </section>
    </>
  );
}