// src/pages/MiPerfil.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function MiPerfil() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      return setError('Las contraseñas nuevas no coinciden.');
    }

    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      setSuccess('Contraseña actualizada con éxito. Cerrando sesión...');
      
      // Por seguridad, cerramos la sesión para que ingresen con la nueva clave
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña');
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2>Mi Perfil</h2>
      <p><strong>Usuario:</strong> {usuario?.nombre} ({usuario?.email})</p>
      <hr style={{ margin: '20px 0' }} />
      
      <h3>Cambiar Contraseña</h3>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Contraseña Actual:</label>
          <input type="password" required value={currentPassword} 
            onChange={(e) => setCurrentPassword(e.target.value)} 
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Nueva Contraseña:</label>
          <input type="password" required value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Confirmar Nueva Contraseña:</label>
          <input type="password" required value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
        </div>

        <button type="submit" style={{ padding: '10px 20px', background: '#3498db', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Actualizar Contraseña
        </button>
      </form>

      <div style={{ marginTop: 24 }}>
        <Link to="/dashboard" style={{ color: '#7f8c8d' }}>← Volver al Dashboard</Link>
      </div>
    </div>
  );
}