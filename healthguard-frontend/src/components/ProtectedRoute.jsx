// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles = null }) {
  const { isAuthenticated, loading, rol } = useAuth();

  if (loading) {
    return <div className="p-4">Cargando sesión…</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.some((r) => rol === r || (r.endsWith('_') && rol?.startsWith(r)))) {
    return (
      <div className="p-4">
        <h2>403 — No autorizado</h2>
        <p>Tu rol ({rol}) no permite acceder a esta sección.</p>
      </div>
    );
  }
  return <Outlet />;
}