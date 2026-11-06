// src/pages/Auditoria.jsx
import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auditoria')
      .then(({ data }) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Error al cargar auditoría');
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>⏳ Cargando bitácora del sistema...</div>;
  if (error) return <div style={{ color: 'red', padding: '2rem' }}>{error}</div>;

  return (
    <div>
      <h1>Auditoría del Sistema</h1>
      <p style={{ color: '#7f8c8d' }}>Registro de las últimas 100 operaciones críticas.</p>
      
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', marginTop: 20 }}>
        <thead style={{ background: '#2c3e50', color: 'white' }}>
          <tr>
            <th>ID</th>
            <th>Fecha y Hora</th>
            <th>Usuario ID</th>
            <th>Operación</th>
            <th>Tabla Afectada</th>
            <th>Detalles (JSON)</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.id}</td>
              <td>{new Date(log.fecha).toLocaleString()}</td>
              <td>{log.usuario_id}</td>
              <td>
                <span style={{ 
                  padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem', fontWeight: 'bold', color: 'white',
                  background: log.operacion === 'INSERT' ? '#27ae60' : log.operacion === 'UPDATE' ? '#f39c12' : log.operacion === 'DELETE' ? '#e74c3c' : '#3498db'
                }}>
                  {log.operacion}
                </span>
              </td>
              <td><strong>{log.tabla}</strong></td>
              <td style={{ fontSize: '0.8rem', color: '#555', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={JSON.stringify(log.datos_nuevos)}>
                {log.datos_nuevos ? JSON.stringify(log.datos_nuevos) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}