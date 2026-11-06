// src/pages/HistorialPaciente.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const FORM_INICIAL = {
  tipo_entrada: 'diagnostico', titulo: '', descripcion: '',
  categoria: '', nivel_confidencialidad: 'medio', es_urgente: false,
};

export default function HistorialPaciente() {
  const { id } = useParams();
  const pacienteId = Number(id);
  const { isAdmin, isMedico } = useAuth();
  const puedeEscribir = isAdmin || isMedico;

  const [paciente, setPaciente] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState('');

  async function cargar() {
    try {
      const [pRes, hRes] = await Promise.all([
        api.get(`/pacientes/${pacienteId}`),
        api.get(`/pacientes/${pacienteId}/historial`),
      ]);
      setPaciente(pRes.data);
      setEntradas(hRes.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Error cargando datos');
    }
  }

  useEffect(() => { cargar(); }, [pacienteId]);

  async function crear(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/pacientes/${pacienteId}/historial`, form);
      setForm(FORM_INICIAL);
      await cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error creando entrada');
    }
  }

  return (
    <div>
      <Link to="/pacientes">← Volver a pacientes</Link>
      <h1>Historial clínico {paciente ? `— ${paciente.nombre}` : ''}</h1>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {puedeEscribir && (
        <form onSubmit={crear} style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <h3>Nueva entrada</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <select value={form.tipo_entrada}
              onChange={(e) => setForm({ ...form, tipo_entrada: e.target.value })}>
              <option value="diagnostico">Diagnóstico</option>
              <option value="medicamento">Medicamento</option>
              <option value="antecedente">Antecedente</option>
              <option value="laboratorio">Laboratorio</option>
              <option value="evolucion">Evolución</option>
            </select>
            <input placeholder="Título" value={form.titulo} required
              onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            <textarea placeholder="Descripción" value={form.descripcion} rows="3"
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              style={{ gridColumn: 'span 2' }} />
            <input placeholder="Categoría (opcional)" value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
            <select value={form.nivel_confidencialidad}
              onChange={(e) => setForm({ ...form, nivel_confidencialidad: e.target.value })}>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
              <option value="critico">Crítico</option>
            </select>
            <label style={{ gridColumn: 'span 2' }}>
              <input type="checkbox" checked={form.es_urgente}
                onChange={(e) => setForm({ ...form, es_urgente: e.target.checked })} />
              {' '}Marcar como urgente
            </label>
          </div>
          <button type="submit" style={{ marginTop: 8 }}>Guardar</button>
        </form>
      )}

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', background: '#fff' }}>
        <thead>
          <tr>
            <th>Fecha</th><th>Tipo</th><th>Título</th><th>Descripción</th>
            <th>Profesional</th><th>Urgente</th>
          </tr>
        </thead>
        <tbody>
          {entradas.map((e) => (
            <tr key={e.historial_id}>
              <td>{new Date(e.fecha_creacion).toLocaleString()}</td>
              <td>{e.tipo_entrada}</td>
              <td>{e.titulo}</td>
              <td>{e.descripcion || '-'}</td>
              <td>{e.profesional_nombre}</td>
              <td>{e.es_urgente ? 'Sí' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}