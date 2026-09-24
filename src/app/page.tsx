export default function Home() {
  return (
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
          <li><span>Policía Nacional Civil</span><strong>110</strong></li>
          <li><span>Bomberos Voluntarios</span><strong>122</strong></li>
          <li><span>Cruz Roja Guatemalteca</span><strong>125</strong></li>
          <li><span>Derechos Humanos (PDH)</span><strong>1555</strong></li>
        </ul>
      </div>
    </div>
  );
}