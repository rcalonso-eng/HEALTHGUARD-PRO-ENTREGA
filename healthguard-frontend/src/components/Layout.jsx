// C:\RICARDO\healthguard-frontend\src\components\Layout.jsx
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { usuario, rol, isAdmin, isMedico, isEnfermero, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 24px', height: '65px', background: '#1a252f', color: '#fff',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderBottom: '3px solid #3498db'
      }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', height: '100%' }}>
          <strong style={{ fontSize: '1.3rem', color: '#3498db', letterSpacing: '1px' }}>HealthGuard Pro</strong>
          
          <nav style={{ display: 'flex', gap: '5px', height: '100%' }}>
            <Link to="/dashboard" className="nav-link">Inicio</Link>
            
            {(isAdmin || isMedico || isEnfermero) && (
              <>
                <Link to="/pacientes" className="nav-link">Pacientes</Link>
                <Link to="/alertas" className="nav-link">Alertas</Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link to="/usuarios" className="nav-link">Usuarios</Link>
                <Link to="/auditoria" className="nav-link">Auditoría</Link> {/* 👈 NUEVO ENLACE */}
              </>
            )}
          </nav>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/perfil" style={{ color: '#ecf0f1', textDecoration: 'none', fontSize: '0.9rem' }}>
            {usuario?.nombre}
          </Link>
          <button onClick={logout} style={{ 
              background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', 
              padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
            }}>
            Salir
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '2rem', background: '#f4f7fb' }}>
        <Outlet />
      </main>

    </div>
  );
}