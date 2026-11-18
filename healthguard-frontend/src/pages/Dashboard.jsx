import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Dashboard() {
  const { usuario, rol, isAdmin, isMedico, isEnfermero, isPaciente, logout } = useAuth();
  
  const [signos, setSignos] = useState([]);
  const [stats, setStats] = useState({ pacientes: 0, alertas: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPaciente && usuario?.usuario_id) {
      api.get(`/pacientes/${usuario.usuario_id}/signos`)
        .then(({ data }) => setSignos(data))
        .catch(() => setSignos([]));
    }
    
    if (isAdmin || isMedico || isEnfermero) {
      Promise.all([
        api.get('/pacientes').catch(() => ({ data: [] })),
        api.get('/alertas?estado=activa').catch(() => ({ data: [] }))
      ]).then(([pacientesRes, alertasRes]) => {
        setStats({
          pacientes: pacientesRes.data.length,
          alertas: alertasRes.data.length
        });
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [isPaciente, usuario, isAdmin, isMedico, isEnfermero]);

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Bienvenido, {usuario?.nombre}</h1>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>
            Rol: <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>{rol}</span>
          </p>
        </div>
        <button onClick={logout} style={{ padding: '10px 20px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', height: 40 }}>
          Cerrar sesión
        </button>
      </header>

      {(isAdmin || isMedico || isEnfermero) && (
        <section>
          <h2 style={{ marginBottom: 20 }}>Panel de {isAdmin ? 'Administrador' : isMedico ? 'Médico' : 'Enfermero'}</h2>
          
          {loading ? (
            <p>⏳ Cargando estadísticas del sistema...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              
              <Link to="/pacientes" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '5px solid #3498db' }}>
                  <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem', fontWeight: 'bold' }}>TOTAL PACIENTES</p>
                  <p style={{ margin: '10px 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: '#2c3e50' }}>{stats.pacientes}</p>
                  <p style={{ margin: '10px 0 0', color: '#3498db', fontSize: '0.9rem' }}>Gestionar Pacientes →</p>
                </div>
              </Link>

              <Link to="/alertas" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '5px solid #e74c3c' }}>
                  <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem', fontWeight: 'bold' }}>ALERTAS ACTIVAS</p>
                  <p style={{ margin: '10px 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: '#e74c3c' }}>{stats.alertas}</p>
                  <p style={{ margin: '10px 0 0', color: '#e74c3c', fontSize: '0.9rem' }}>Ver Alertas →</p>
                </div>
              </Link>

              {isAdmin && (
                <Link to="/auditoria" style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '5px solid #f39c12' }}>
                    <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem', fontWeight: 'bold' }}>SEGURIDAD</p>
                    <p style={{ margin: '10px 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>Auditoría</p>
                    <p style={{ margin: '10px 0 0', color: '#f39c12', fontSize: '0.9rem' }}>Ver Bitácora →</p>
                  </div>
                </Link>
              )}
            </div>
          )}
        </section>
      )}

      {isPaciente && (
        <section style={{ marginTop: 32 }}>
          <h2>Mis signos vitales recientes</h2>
          {signos.length === 0 ? (
            <div style={{ background: '#fff', padding: 24, borderRadius: 8, color: '#7f8c8d' }}>
              Todavía no tienes registros médicos.
            </div>
          ) : (
            <table border="1" cellPadding="12" style={{ borderCollapse: 'collapse', width: '100%', background: '#fff' }}>
              <thead style={{ background: '#34495e', color: 'white' }}>
                <tr>
                  <th>Fecha</th><th>Glucosa</th><th>Presión</th>
                  <th>Peso</th><th>FC</th><th>O₂</th>
                </tr>
              </thead>
              <tbody>
                {signos.slice(0, 5).map((s) => (
                  <tr key={s.signo_vital_id}>
                    <td>{new Date(s.fecha_registro + 'Z').toLocaleString()}</td>
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