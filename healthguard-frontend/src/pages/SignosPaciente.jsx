// src/pages/SignosPaciente.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const FORM_INICIAL = {
  glucosa: '', presion_sistolica: '', presion_diastolica: '',
  peso: '', frecuencia_cardiaca: '', oxigenacion: '', observaciones: '',
};

export default function SignosPaciente() {
  const { id } = useParams();
  const pacienteId = Number(id);
  const { isAdmin, isMedico, isEnfermero } = useAuth();
  const puedeEscribir = isAdmin || isMedico || isEnfermero;

  const [paciente, setPaciente] = useState(null);
  const [signos, setSignos] = useState([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  async function cargar() {
    try {
      const [pRes, sRes] = await Promise.all([
        api.get(`/pacientes/${pacienteId}`),
        api.get(`/pacientes/${pacienteId}/signos`),
      ]);
      setPaciente(pRes.data);
      setSignos(sRes.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Error cargando datos');
    }
  }

  useEffect(() => { cargar(); }, [pacienteId]);

  function num(v) { return v === '' ? null : Number(v); }

  async function registrar(e) {
    e.preventDefault();
    setError(''); setOk('');
    try {
      await api.post(`/pacientes/${pacienteId}/signos`, {
        glucosa: num(form.glucosa),
        presion_sistolica: num(form.presion_sistolica),
        presion_diastolica: num(form.presion_diastolica),
        peso: num(form.peso),
        frecuencia_cardiaca: num(form.frecuencia_cardiaca),
        oxigenacion: num(form.oxigenacion),
        observaciones: form.observaciones || null,
        tipo_registro: 'manual',
      });
      setForm(FORM_INICIAL);
      setOk('Signo vital registrado.');
      await cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error registrando signo');
    }
  }

  return (
    <div>
      <Link to="/pacientes">← Volver a pacientes</Link>
      <h1>Signos vitales {paciente ? `— ${paciente.nombre}` : ''}</h1>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {ok && <p style={{ color: 'green' }}>{ok}</p>}

      {puedeEscribir && (
        <form onSubmit={registrar} style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <h3>Registrar signo vital</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <input type="number" step="0.1" placeholder="Glucosa" value={form.glucosa}
              onChange={(e) => setForm({ ...form, glucosa: e.target.value })} />
            <input type="number" placeholder="Sistólica" value={form.presion_sistolica}
              onChange={(e) => setForm({ ...form, presion_sistolica: e.target.value })} />
            <input type="number" placeholder="Diastólica" value={form.presion_diastolica}
              onChange={(e) => setForm({ ...form, presion_diastolica: e.target.value })} />
            <input type="number" step="0.1" placeholder="Peso (kg)" value={form.peso}
              onChange={(e) => setForm({ ...form, peso: e.target.value })} />
            <input type="number" placeholder="FC (lpm)" value={form.frecuencia_cardiaca}
              onChange={(e) => setForm({ ...form, frecuencia_cardiaca: e.target.value })} />
            <input type="number" step="0.1" placeholder="O₂ (%)" value={form.oxigenacion}
              onChange={(e) => setForm({ ...form, oxigenacion: e.target.value })} />
            <input placeholder="Observaciones" value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              style={{ gridColumn: 'span 3' }} />
          </div>
          <button type="submit" style={{ marginTop: 8 }}>Registrar</button>
        </form>
      )}

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', background: '#fff' }}>
        <thead>
          <tr>
            <th>Fecha</th><th>Glucosa</th><th>Presión</th>
            <th>Peso</th><th>FC</th><th>O₂</th><th>Observaciones</th>
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
              <td>{s.observaciones || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}