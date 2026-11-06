import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Pacientes() {
  const { isAdmin, isMedico } = useAuth(); // 👈 Traemos isMedico también
  const [pacientes, setPacientes] = useState([]);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState({ nombre: '', email: '', password: '', telefono: '', direccion: '' });
  const [mostrarForm, setMostrarForm] = useState(false);

  async function cargar() {
    try {
      const { data } = await api.get('/pacientes');
      setPacientes(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Error cargando pacientes');
    }
  }

  useEffect(() => { cargar(); }, []);

  async function crear(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/pacientes', nuevo);
      setNuevo({ nombre: '', email: '', password: '', telefono: '', direccion: '' });
      setMostrarForm(false);
      await cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error creando paciente');
    }
  }

  async function desactivar(id) {
    if (!window.confirm('¿Desactivar este paciente?')) return;
    try {
      await api.delete(`/pacientes/${id}`);
      await cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error desactivando paciente');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Pacientes</h1>
        {isAdmin && (
          <button onClick={() => setMostrarForm((v) => !v)} style={{ background: '#3498db', color: 'white', border: 'none', padding: '10px 15px', borderRadius: 4, cursor: 'pointer' }}>
            {mostrarForm ? 'Cancelar' : '+ Nuevo paciente'}
          </button>
        )}
      </div>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {mostrarForm && isAdmin && (
        <form onSubmit={crear} style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <h3>Nuevo paciente</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input placeholder="Nombre" value={nuevo.nombre} required style={{ padding: 8 }}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
            <input type="email" placeholder="Email" value={nuevo.email} required style={{ padding: 8 }}
              onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} />
            <input type="password" placeholder="Contraseña" value={nuevo.password} required style={{ padding: 8 }}
              onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })} />
            <input placeholder="Teléfono" value={nuevo.telefono} style={{ padding: 8 }}
              onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} />
            <input placeholder="Dirección" value={nuevo.direccion} style={{ padding: 8 }}
              onChange={(e) => setNuevo({ ...nuevo, direccion: e.target.value })} />
          </div>
          <button type="submit" style={{ marginTop: 12, background: '#27ae60', color: 'white', border: 'none', padding: '10px 15px', borderRadius: 4, cursor: 'pointer' }}>Guardar Paciente</button>
        </form>
      )}

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', background: '#fff' }}>
        <thead style={{ background: '#34495e', color: 'white' }}>
          <tr><th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {pacientes.map((p) => (
            <tr key={p.usuario_id}>
              <td>{p.usuario_id}</td>
              <td>{p.nombre}</td>
              <td>{p.email}</td>
              <td>{p.telefono || '-'}</td>
              <td style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Link to={`/pacientes/${p.usuario_id}/signos`} style={{ color: '#3498db' }}>Signos</Link>
                <Link to={`/pacientes/${p.usuario_id}/historial`} style={{ color: '#8e44ad' }}>Historial</Link>
                
                {/* BOTÓN DE EDITAR: Solo visible para admin y médico */}
                {(isAdmin || isMedico) && (
                  <Link to={`/pacientes/editar/${p.usuario_id}`} style={{ color: '#f39c12', fontWeight: 'bold' }}>
                    Editar
                  </Link>
                )}

                {isAdmin && (
                  <button onClick={() => desactivar(p.usuario_id)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 4, cursor: 'pointer' }}>
                    Desactivar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}