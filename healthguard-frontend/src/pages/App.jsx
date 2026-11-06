import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import SignosPaciente from './pages/SignosPaciente';
import HistorialPaciente from './pages/HistorialPaciente';
import Alertas from './pages/Alertas';
import EditarPaciente from './pages/EditarPaciente';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/alertas" element={<Alertas />} />
            </Route>
          </Route>
          
          <Route element={<ProtectedRoute roles={['administrador_sistema', 'medico_', 'enfermero_']} />}>
            <Route element={<Layout />}>
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/pacientes/:id/signos" element={<SignosPaciente />} />
              <Route path="/pacientes/editar/:id" element={<EditarPaciente />} />
            </Route>
          </Route>
          
          <Route element={<ProtectedRoute roles={['administrador_sistema', 'medico_', 'paciente_']} />}>
            <Route element={<Layout />}>
              <Route path="/pacientes/:id/historial" element={<HistorialPaciente />} />
            </Route>
          </Route>
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

