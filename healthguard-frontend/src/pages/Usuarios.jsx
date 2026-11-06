// src/pages/Usuarios.jsx
import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Usuarios() {
  const { isAdmin } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');

  // Mapeo de IDs de roles (según tu init.sql)
  const rolesDisponibles = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Director Médico' },
    { id: 3, nombre: 'Médico Especialista' },
    { id: 6, nombre: 'Enfermero' },
    { id: 8, nombre: 'Paciente' }
  ];

  async function cargar() {
    try {
      const { data } = await api.get('/auth/usuarios');
      setUsuarios(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al cargar usuarios');
    }
  }

  useEffect(() => { cargar(); }, []);

  async function cambiarRol(usuarioId, nuevoRolId) {
    if (!window.confirm('¿Cambiar el rol de este usuario?')) return;
    try {
      await api.put(`/auth/usuarios/${usuarioId}/rol`, { rol_id: nuevoRolId });
      await cargar(); // Recargar tabla
    } catch (e) {
      setError(e.response?.data?.error || 'Error al cambiar rol');
    }
  }

  if (!isAdmin) return <h2>No tienes permisos para ver esta página</h2>;

  return (
    <div>
      <h1>Gestión de Usuarios y Roles</h1>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', background: '#fff' }}>
        <thead style={{ background: '#34495e', color: 'white' }}>
          <tr>
            <th>ID</th><th>Nombre</th><th>Email</th><th>Rol Actual</th><th>Cambiar Rol</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.usuario_id}>
              <td>{u.usuario_id}</td>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td><strong>{u.rol}</strong></td>
              <td>
                <select 
                  onChange={(e) => cambiarRol(u.usuario_id, e.target.value)}
                  defaultValue=""
                  style={{ padding: 5 }}
                >
                  <option value="" disabled>-- Seleccionar nuevo rol --</option>
                  {rolesDisponibles.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}