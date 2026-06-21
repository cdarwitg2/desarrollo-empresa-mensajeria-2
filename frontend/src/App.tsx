import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './Autenticacion/Autenticacion.Components/Login';
import { Register } from './Autenticacion/Autenticacion.Components/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleBasedRouter } from './components/RoleBasedRouter';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Ruta protegida con wildcard para rutas anidadas */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <RoleBasedRouter />
              </ProtectedRoute>
            }
          />
          
          {/* Redirecciones */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;