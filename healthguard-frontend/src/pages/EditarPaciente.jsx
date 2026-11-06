import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';

export default function EditarPaciente() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    nombre: '', 
    telefono: '', 
    direccion: '', 
    codigo_postal: '', 
    genero: '', 
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Cargar datos actuales
  useEffect(() => {
    api.get(`/pacientes/${id}`)
      .then(({ data }) => {
        setForm({
          nombre: data.nombre || '',
          telefono: data.telefono || '',
          direccion: data.direccion || '',
          codigo_postal: data.codigo_postal || '',
          genero: data.genero || '',
          password: ''
        });
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar los datos del paciente');
        setLoading(false);
      });
  }, [id]);

  // Enviar cambios
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password; // Solo enviar si se escribió

      await api.put(`/pacientes/${id}`, payload);
      navigate('/pacientes');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar paciente');
    }
  }

  if (loading) return <div style={{ padding: '2rem' }}>Cargando datos...</div>;

  return (
    <div>
      <Link to="/pacientes">← Volver a pacientes</Link>
      <div style={{ maxWidth: 600, margin: '2rem auto', background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2>Editar Paciente #{id}</h2>
        
        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Nombre completo:</label>
            <input type="text" required value={form.nombre} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Teléfono:</label>
            <input type="text" value={form.telefono} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Dirección:</label>
            <input type="text" value={form.direccion} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Código Postal:</label>
            <input type="text" value={form.codigo_postal} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
              onChange={(e) => setForm({ ...form, codigo_postal: e.target.value })} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Género:</label>
            <select value={form.genero} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
              onChange={(e) => setForm({ ...form, genero: e.target.value })}>
              <option value="">-- Seleccionar --</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Nueva Contraseña (opcional):</label>
            <input type="password" value={form.password} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
              placeholder="Dejar en blanco para mantener la actual"
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" style={{ padding: '10px 20px', background: '#3498db', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Guardar Cambios
            </button>
            <Link to="/pacientes" style={{ padding: '10px 20px', background: '#95a5a6', color: '#fff', textDecoration: 'none', borderRadius: 4 }}>
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}