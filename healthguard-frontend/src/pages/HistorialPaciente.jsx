import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const FORM_INICIAL = {
  tipo_entrada: 'diagnostico', 
  titulo: '', 
  descripcion: '',
  categoria: '', 
  nivel_confidencialidad: 'medio', 
  es_urgente: false,
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
  const [mostrarForm, setMostrarForm] = useState(false);

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
      setMostrarForm(false);
      await cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error creando entrada');
    }
  }

  return (
    <div>
      <Link to="/pacientes">← Volver a pacientes</Link>
      
      {/* Encabezado con el botón de Imprimir */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <h1>Historial clínico {paciente ? `— ${paciente.nombre}` : ''}</h1>
        
        {/* 👇 BOTÓN DE IMPRIMIR 👇 */}
        <button 
          onClick={() => window.print()} 
          style={{ padding: '10px 20px', background: '#34495e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
        >
          🖨️ Imprimir Expediente
        </button>
      </div>

      {puedeEscribir && (
        <button 
          onClick={() => setMostrarForm(!mostrarForm)}
          style={{ padding: '10px 20px', marginTop: 10, background: mostrarForm ? '#e74c3c' : '#3498db', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
        >
          {mostrarForm ? 'Cancelar' : '+ Nueva Nota Médica'}
        </button>
      )}

      {error && <p style={{ color: 'crimson', padding: 10, background: '#fadbd8', borderRadius: 4 }}>{error}</p>}

      {puedeEscribir && mostrarForm && (
        <form onSubmit={crear} style={{ background: '#fff', padding: 24, borderRadius: 8, marginTop: 16, marginBottom: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Registrar Nota Médica</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>Tipo de Entrada:</label>
              <select value={form.tipo_entrada} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
                onChange={(e) => setForm({ ...form, tipo_entrada: e.target.value })}>
                <option value="diagnostico">Diagnóstico</option>
                <option value="medicamento">Medicamento</option>
                <option value="antecedente">Antecedente</option>
                <option value="laboratorio">Laboratorio</option>
                <option value="evolucion">Evolución</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>Título (Resumen):</label>
              <input 
                placeholder="Ej. Control de presión arterial" 
                value={form.titulo} required 
                style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })} 
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>Descripción / Nota Médica:</label>
              <textarea 
                placeholder="Escriba los síntomas, diagnóstico, tratamiento o evolución del paciente..." 
                value={form.descripcion} rows="4"
                style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>Categoría:</label>
              <input 
                placeholder="Ej. Cardiología, Pediatría (Opcional)" 
                value={form.categoria}
                style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>Confidencialidad:</label>
              <select value={form.nivel_confidencialidad} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
                onChange={(e) => setForm({ ...form, nivel_confidencialidad: e.target.value })}>
                <option value="bajo">Bajo</option>
                <option value="medio">Medio</option>
                <option value="alto">Alto</option>
                <option value="critico">Crítico</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 2', marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#e74c3c', fontWeight: 'bold' }}>
                <input type="checkbox" checked={form.es_urgente} style={{ width: 18, height: 18 }}
                  onChange={(e) => setForm({ ...form, es_urgente: e.target.checked })} />
                Marcar como urgente (Generará notificación al paciente)
              </label>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <button type="submit" style={{ padding: '10px 20px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
              Guardar Nota
            </button>
          </div>
        </form>
      )}

      <table border="1" cellPadding="12" style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', marginTop: 16 }}>
        <thead style={{ background: '#34495e', color: 'white' }}>
          <tr>
            <th>Fecha</th><th>Tipo</th><th>Título</th><th>Descripción</th>
            <th>Profesional</th><th>Urgente</th>
          </tr>
        </thead>
        <tbody>
          {entradas.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: 20, color: '#7f8c8d' }}>
                No hay notas médicas registradas para este paciente.
              </td>
            </tr>
          ) : (
            entradas.map((e) => (
              <tr key={e.historial_id} style={{ backgroundColor: e.es_urgente ? '#fadbd8' : 'transparent' }}>
                <td>{new Date(e.fecha_creacion + 'Z').toLocaleString()}</td>
                <td style={{ textTransform: 'capitalize' }}>{e.tipo_entrada}</td>
                <td><strong>{e.titulo}</strong></td>
                <td>{e.descripcion || '-'}</td>
                <td>{e.profesional_nombre}</td>
                <td style={{ color: e.es_urgente ? '#e74c3c' : 'inherit', fontWeight: e.es_urgente ? 'bold' : 'normal' }}>
                  {e.es_urgente ? 'SÍ' : 'No'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}