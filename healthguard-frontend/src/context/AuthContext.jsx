// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import api, { logoutLocal } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehidratar sesión al arrancar
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then(({ data }) => setUsuario(data))
      .catch(() => logoutLocal())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  }

  function logout() {
    logoutLocal();
    setUsuario(null);
  }

  // Helpers de rol (mismo comportamiento que en Flask)
  const rol = usuario?.rol_principal || null;
  const isAdmin = rol === 'administrador_sistema';
  const isMedico = rol?.startsWith('medico') ?? false;
  const isEnfermero = rol?.startsWith('enfermero') ?? false;
  const isPaciente = rol?.startsWith('paciente') ?? false;

  const value = {
    usuario, loading, login, logout,
    rol, isAdmin, isMedico, isEnfermero, isPaciente,
    isAuthenticated: !!usuario,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}