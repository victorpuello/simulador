import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import MetricasSesiones from '../components/admin/MetricasSesiones';

const MetricasPage: React.FC = () => {
  const { user } = useAuth();

  // Verificar que el usuario sea docente
  if (!user || user.rol !== 'docente') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📊 Centro de Métricas</h1>
        <p className="text-gray-600 mt-2">
          Analiza el rendimiento y uso del simulador por parte de los estudiantes.
        </p>
      </div>

      <MetricasSesiones />
    </div>
  );
};

export default MetricasPage;