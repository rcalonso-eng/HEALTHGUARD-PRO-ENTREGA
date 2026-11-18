import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Usuarios() {
  const { isAdmin } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados para el formulario de creación
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoUser, setNuevoUser] = useState({ nombre: '', email: '', password: '', rol_id: '' });

  const rolesDisponibles = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Director Médico' },
    { id: 3, nombre: 'Médico Especialista' },
    { id: 4, nombre: 'Médico General' },
    { id: 6, nombre: 'Enfermero' },
    { id: 8, nombre: 'Paciente' }
  ];

  async function cargar() {
    try {
      const { data } = await api.get('/auth/usuarios');
      setUsuarios(data);
      setLoading(false);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al cargar usuarios');
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function cambiarRol(usuarioId, nuevoRolId) {
    if (!window.confirm('¿Estás seguro de cambiar el rol de este usuario?')) return;
    try {
      await api.put(`/auth/usuarios/${usuarioId}/rol`, { rol_id: nuevoRolId });
      await cargar(); 
    } catch (e) {
      setError(e.response?.data?.error || 'Error al cambiar rol');
    }
  }

  async function crearUsuario(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/usuarios', nuevoUser);
      setNuevoUser({ nombre: '', email: '', password: '', rol_id: '' });
      setMostrarForm(false);
      await cargar(); 
    } catch (e) {
      setError(e.response?.data?.error || 'Error al crear usuario');
    }
  }

  async function desbloquearUsuario(usuarioId) {
    if (!window.confirm('¿Desbloquear esta cuenta?')) return;
    try {
      await api.put(`/auth/usuarios/${usuarioId}/desbloquear`);
      await cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al desbloquear usuario');
    }
  }

  if (!isAdmin) return <h2 style={{ padding: '2rem', color: 'red' }}>No tienes permisos para ver esta página</h2>;
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>⏳ Cargando usuarios...</div>;

  // Filtro de búsqueda
  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Gestión de Usuarios</h1>
          <p style={{ color: '#7f8c8d', marginTop: 8 }}>Administra los roles y accesos del sistema.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="🔍 Buscar por nombre o email..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ padding: '10px 16px', width: 280, borderRadius: 6, border: '1px solid #ccc', fontSize: '1rem' }}
          />
          <button 
            onClick={() => setMostrarForm(!mostrarForm)} 
            style={{ padding: '10px 20px', background: mostrarForm ? '#e74c3c' : '#27ae60', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}
          >
            {mostrarForm ? 'Cancelar' : '+ Nuevo Usuario'}
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'crimson', background: '#fadbd8', padding: 12, borderRadius: 6 }}>{error}</p>}
      
      {/* Formulario de creación */}
      {mostrarForm && (
        <form onSubmit={crearUsuario} style={{ background: '#fff', padding: 24, borderRadius: 8, marginBottom: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Registrar Nuevo Usuario</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input placeholder="Nombre completo" required value={nuevoUser.nombre} 
              style={{ padding: 10, border: '1px solid #ccc', borderRadius: 4 }}
              onChange={(e) => setNuevoUser({ ...nuevoUser, nombre: e.target.value })} />
            <input type="email" placeholder="Correo electrónico" required value={nuevoUser.email} 
              style={{ padding: 10, border: '1px solid #ccc', borderRadius: 4 }}
              onChange={(e) => setNuevoUser({ ...nuevoUser, email: e.target.value })} />
            <input type="password" placeholder="Contraseña temporal" required value={nuevoUser.password} 
              style={{ padding: 10, border: '1px solid #ccc', borderRadius: 4 }}
              onChange={(e) => setNuevoUser({ ...nuevoUser, password: e.target.value })} />
            <select required value={nuevoUser.rol_id} 
              style={{ padding: 10, border: '1px solid #ccc', borderRadius: 4 }}
              onChange={(e) => setNuevoUser({ ...nuevoUser, rol_id: e.target.value })}>
              <option value="" disabled>-- Seleccionar Rol --</option>
              {rolesDisponibles.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
          <button type="submit" style={{ marginTop: 16, padding: '10px 20px', background: '#2980b9', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
            Guardar Usuario
          </button>
        </form>
      )}

      <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#2c3e50', color: '#fff' }}>
            <tr>
              <th style={{ padding: 16, textAlign: 'left' }}>ID</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Nombre</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Email</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Rol Actual</th>
              <th style={{ padding: 16, textAlign: 'center' }}>Cambiar Rol</th>
              <th style={{ padding: 16, textAlign: 'center' }}>Acciones</th> {/* 👈 Nueva columna */}
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: 24, textAlign: 'center', color: '#7f8c8d' }}>No se encontraron usuarios.</td>
              </tr>
            ) : (
              usuariosFiltrados.map((u) => (
                <tr key={u.usuario_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 16, color: '#7f8c8d' }}>#{u.usuario_id}</td>
                  <td style={{ padding: 16, fontWeight: 'bold', color: '#2c3e50' }}>
                    {u.nombre}
                    {u.cuenta_bloqueada && (
                      <span style={{ marginLeft: 8, background: '#e74c3c', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem' }}>BLOQUEADO</span>
                    )}
                  </td>
                  <td style={{ padding: 16, color: '#34495e' }}>{u.email}</td>
                  <td style={{ padding: 16 }}>
                    <span style={{ 
                      padding: '6px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 'bold',
                      background: u.rol.includes('admin') ? '#e8f8f5' : u.rol.includes('medico') || u.rol.includes('director') ? '#ebf5fb' : u.rol.includes('enfermero') ? '#fef9e7' : '#f4f6f7',
                      color: u.rol.includes('admin') ? '#117a65' : u.rol.includes('medico') || u.rol.includes('director') ? '#2874a6' : u.rol.includes('enfermero') ? '#b7950b' : '#5d6d7e'
                    }}>
                      {u.rol}
                    </span>
                  </td>
                  <td style={{ padding: 16, textAlign: 'center' }}>
                    <select 
                      onChange={(e) => cambiarRol(u.usuario_id, e.target.value)}
                      defaultValue=""
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer', outline: 'none' }}
                    >
                      <option value="" disabled>-- Cambiar a --</option>
                      {rolesDisponibles.map(r => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: 16, textAlign: 'center' }}>
                    {/* 👇 Botón de Desbloquear 👇 */}
                    <button 
                      onClick={() => desbloquearUsuario(u.usuario_id)}
                      style={{ 
                        padding: '6px 12px', 
                        background: u.cuenta_bloqueada ? '#f39c12' : '#bdc3c7', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: 4, 
                        cursor: u.cuenta_bloqueada ? 'pointer' : 'not-allowed', 
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}
                      disabled={!u.cuenta_bloqueada}
                      title={u.cuenta_bloqueada ? "Desbloquear cuenta" : "La cuenta no está bloqueada"}
                    >
                      Desbloquear
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}