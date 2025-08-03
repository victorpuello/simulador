import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './store';
import NotificationContainer from './components/ui/NotificationContainer';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Páginas
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const SimulacionPage = React.lazy(() => import('./pages/SimulacionPage'));
const ReportesPage = React.lazy(() => import('./pages/ReportesPage'));
const PerfilPage = React.lazy(() => import('./pages/PerfilPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const GestionPreguntasPage = React.lazy(() => import('./pages/GestionPreguntasPage'));
const GestionUsuariosPage = React.lazy(() => import('./pages/GestionUsuariosPage'));

// Componentes de layout
const Layout = React.lazy(() => import('./components/layout/Layout'));
const LoadingSpinner = React.lazy(() => import('./components/ui/LoadingSpinner'));

function App() {
  const { isAuthenticated, isInitialized } = useAuth();
  const { theme } = useTheme();

  // Aplicar tema
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme.mode === 'dark');
  }, [theme.mode]);

  // Mostrar loading mientras se inicializa la autenticación
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <NotificationContainer />
        
        <React.Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Rutas públicas */}
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
              }
            />
            <Route
              path="/register"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
              }
            />
            
            {/* Rutas protegidas */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Layout>
                    <DashboardPage />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                isAuthenticated ? (
                  <Layout>
                    <DashboardPage />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/simulacion"
              element={
                <ProtectedRoute allowedRoles={['estudiante']}>
                  <Layout>
                    <SimulacionPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulacion/:materiaId"
              element={
                <ProtectedRoute allowedRoles={['estudiante']}>
                  <Layout>
                    <SimulacionPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reportes"
              element={
                <ProtectedRoute allowedRoles={['estudiante']}>
                  <Layout>
                    <ReportesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                isAuthenticated ? (
                  <Layout>
                    <PerfilPage />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/admin"
              element={
                isAuthenticated ? (
                  <Layout>
                    <AdminPage />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/gestion-preguntas"
              element={
                isAuthenticated ? (
                  <Layout>
                    <GestionPreguntasPage />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/gestion-usuarios"
              element={
                isAuthenticated ? (
                  <Layout>
                    <GestionUsuariosPage />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            
            {/* Ruta por defecto */}
            <Route
              path="*"
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
            />
          </Routes>
        </React.Suspense>
      </div>
    </Router>
  );
}

export default App;
