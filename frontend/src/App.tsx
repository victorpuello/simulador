import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
// import { useEffect } from 'react';
import { useTheme } from './store';
import NotificationContainer from './components/ui/NotificationContainer';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Páginas
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const SimulacionPage = React.lazy(() => import('./pages/SimulacionPage'));
const SimulacionComponent = React.lazy(() => import('./components/simulacion/SimulacionComponent'));
const SimulacionActiva = React.lazy(() => import('./components/simulacion/SimulacionActiva'));
const ReportesPage = React.lazy(() => import('./pages/ReportesPage'));
const PerfilPage = React.lazy(() => import('./pages/PerfilPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const GestionPreguntasPage = React.lazy(() => import('./pages/GestionPreguntasPage'));
const GestionUsuariosPage = React.lazy(() => import('./pages/GestionUsuariosPage'));
const GestionSimulacionesPage = React.lazy(() => import('./pages/GestionSimulacionesPage'));
const SeleccionPlantillaPage = React.lazy(() => import('./pages/SeleccionPlantillaPage'));
const ResultadosDetalladosPage = React.lazy(() => import('./pages/ResultadosDetalladosPage'));
const MetricasPage = React.lazy(() => import('./pages/MetricasPage'));
const ReportesDocentePage = React.lazy(() => import('./pages/ReportesDocentePage'));

// Componentes de layout
const Layout = React.lazy(() => import('./components/layout/Layout'));
const LoadingSpinner = React.lazy(() => import('./components/ui/LoadingSpinner'));

function App() {
  const { isAuthenticated, isInitialized, user } = useAuth();
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
                <ProtectedRoute allowedRoles={['estudiante', 'docente']}>
                  <Layout>
                    {user?.rol === 'docente' ? <GestionSimulacionesPage /> : <SimulacionPage />}
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulacion/iniciar/:materiaId"
              element={
                <ProtectedRoute allowedRoles={['estudiante']}>
                  <Layout>
                    <SeleccionPlantillaPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulacion/:materiaId/:plantillaId"
              element={
                <ProtectedRoute allowedRoles={['estudiante']}>
                  <Layout>
                    <SimulacionComponent />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulacion/activa/:sesionId"
              element={
                <ProtectedRoute allowedRoles={['estudiante']}>
                  <Layout>
                    <SimulacionActiva />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulacion/resultados/:sesionId"
              element={
                <ProtectedRoute allowedRoles={['estudiante']}>
                  <Layout>
                    <ResultadosDetalladosPage />
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
              path="/reportes/docente"
              element={
                <ProtectedRoute allowedRoles={['docente']}>
                  <Layout>
                    <ReportesDocentePage />
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
            <Route
              path="/metricas"
              element={
                <ProtectedRoute allowedRoles={['docente']}>
                  <Layout>
                    <MetricasPage />
                  </Layout>
                </ProtectedRoute>
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
