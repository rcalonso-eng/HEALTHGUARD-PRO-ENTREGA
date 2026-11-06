// src/pages/Alertas.jsx
import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Alertas() {
  const { isAdmin, isMedico, isEnfermero } = useAuth();
  const puedeResolver = isAdmin || isMedico || isEnfermero;

  const [alertas, setAlertas] = useState([]);
  const [error, setError] = useState('');
  const [seleccionada, setSeleccionada] = useState(null);
  const [accion, setAccion] = useState('');

  async function cargar() {
    try {
      const { data } = await api.get('/alertas');
      setAlertas(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Error cargando alertas');
    }
  }

  useEffect(() => { cargar(); }, []);

  async function resolver(e) {
    e.preventDefault();
    if (!seleccionada) return;
    try {
      await api.post(`/alertas/${seleccionada.alerta_id}/resolver`, { accion });
      setSeleccionada(null);
      setAccion('');
      await cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error resolviendo alerta');
    }
  }

  return (
    <div>
      <h1>Alertas</h1>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {seleccionada && puedeResolver && (
        <form onSubmit={resolver} style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <h3>Resolver alerta #{seleccionada.alerta_id}</h3>
          <p><strong>Paciente:</strong> {seleccionada.paciente_nombre}</p>
          <p><strong>Motivo:</strong> {seleccionada.mensaje}</p>
          <textarea placeholder="Acción tomada" value={accion} required rows="3"
            onChange={(e) => setAccion(e.target.value)}
            style={{ width: '100%' }} />
          <button type="submit" style={{ marginTop: 8 }}>Marcar resuelta</button>
          <button type="button" onClick={() => setSeleccionada(null)} style={{ marginLeft: 8, background: '#888' }}>
            Cancelar
          </button>
        </form>
      )}

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', background: '#fff' }}>
        <thead>
          <tr>
            <th>ID</th><th>Paciente</th><th>Tipo</th><th>Valor</th>
            <th>Urgencia</th><th>Estado</th><th>Fecha</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {alertas.map((a) => (
            <tr key={a.alerta_id}>
              <td>{a.alerta_id}</td>
              <td>{a.paciente_nombre}</td>
              <td>{a.tipo_signo_vital}</td>
              <td>{a.valor_registrado}</td>
              <td>{a.nivel_urgencia}</td>
              <td>{a.estado}</td>
              <td>{new Date(a.fecha_generacion).toLocaleString()}</td>
              <td>
                {puedeResolver && a.estado === 'activa' && (
                  <button onClick={() => setSeleccionada(a)}>Resolver</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}