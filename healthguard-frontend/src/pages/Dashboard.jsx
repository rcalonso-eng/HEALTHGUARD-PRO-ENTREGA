// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Dashboard() {
  const { usuario, rol, isAdmin, isMedico, isEnfermero, isPaciente, logout } = useAuth();
  const [signos, setSignos] = useState([]);

  useEffect(() => {
    if (isPaciente && usuario?.usuario_id) {
      api.get(`/pacientes/${usuario.usuario_id}/signos`)
        .then(({ data }) => setSignos(data))
        .catch(() => setSignos([]));
    }
  }, [isPaciente, usuario]);

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1>Bienvenido, {usuario?.nombre}</h1>
          <p>Rol: <strong>{rol}</strong></p>
        </div>
        <button onClick={logout} style={{ padding: '8px 16px' }}>Cerrar sesión</button>
      </header>

      {(isAdmin || isMedico || isEnfermero) && (
        <section>
          <h2>Panel de {isAdmin ? 'Administrador' : isMedico ? 'Médico' : 'Enfermero'}</h2>
          <p>.</p>
        </section>
      )}

      {isPaciente && (
        <section>
          <h2>Mis signos vitales</h2>
          {signos.length === 0 ? (
            <p>Todavía no tienes registros.</p>
          ) : (
            <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Fecha</th><th>Glucosa</th><th>Presión</th>
                  <th>Peso</th><th>FC</th><th>O₂</th>
                </tr>
              </thead>
              <tbody>
                {signos.map((s) => (
                  <tr key={s.signo_vital_id}>
                    <td>{new Date(s.fecha_registro).toLocaleString()}</td>
                    <td>{s.glucosa ?? '-'}</td>
                    <td>{s.presion_sistolica ?? '-'}/{s.presion_diastolica ?? '-'}</td>
                    <td>{s.peso ?? '-'}</td>
                    <td>{s.frecuencia_cardiaca ?? '-'}</td>
                    <td>{s.oxigenacion ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}