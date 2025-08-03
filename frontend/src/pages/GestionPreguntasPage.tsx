import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useNotifications } from '../store';
import PreguntasList from '../components/admin/PreguntasList';
import PreguntaFilters from '../components/admin/PreguntaFilters';
import PreguntaForm from '../components/admin/PreguntaForm';
import PreguntasStats from '../components/admin/PreguntasStats';
import CargaMasivaPreguntas from '../components/admin/CargaMasivaPreguntas';

interface Pregunta {
  id: number;
  materia: {
    id: number;
    nombre: string;
    nombre_display: string;
  };
  competencia?: {
    id: number;
    nombre: string;
  };
  contexto: string;
  imagen?: string | null;
  imagen_url?: string | null;
  enunciado: string;
  opciones: Record<string, string>;
  respuesta_correcta: string;
  retroalimentacion: string;
  explicacion: string;
  habilidad_evaluada: string;
  dificultad: 'facil' | 'media' | 'dificil';
  tiempo_estimado: number;
  tags: string[];
  activa: boolean;
}

interface Filtros {
  materia: string;
  competencia: string;
  dificultad: string;
  busqueda: string;
  mostrar_inactivas: boolean;
}

type Vista = 'lista' | 'crear' | 'editar' | 'estadisticas' | 'carga-masiva';

const GestionPreguntasPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  // Estados principales
  const [vista, setVista] = useState<Vista>('lista');
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [preguntaEditando, setPreguntaEditando] = useState<Pregunta | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  
  // Estados de filtros
  const [filtros, setFiltros] = useState<Filtros>({
    materia: '',
    competencia: '',
    dificultad: '',
    busqueda: '',
    mostrar_inactivas: false
  });

  // Verificar permisos
  if (!user || !['docente', 'admin'].includes(user.rol) && !user.is_staff) {
    return <Navigate to="/dashboard" replace />;
  }

  // Cargar preguntas
  const cargarPreguntas = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        page_size: itemsPerPage.toString(),
        ordering: 'materia__nombre,dificultad'
      });

      // Agregar filtros
      if (filtros.materia) params.append('materia', filtros.materia);
      if (filtros.competencia) params.append('competencia', filtros.competencia);
      if (filtros.dificultad) params.append('dificultad', filtros.dificultad);
      if (filtros.busqueda) params.append('search', filtros.busqueda);
      if (filtros.mostrar_inactivas) params.append('show_inactive', 'true');

      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/core/preguntas/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar preguntas');
      }

      const data = await response.json();
      
      setPreguntas(data.results);
      setTotalPages(Math.ceil(data.count / itemsPerPage));
      setTotalItems(data.count);
      setPage(pageNum);

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al cargar preguntas',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar preguntas al montar y cuando cambien filtros
  useEffect(() => {
    cargarPreguntas(1);
  }, [filtros]);

  // Manejar cambios de filtros
  const handleFiltrosChange = (nuevosFiltros: Partial<Filtros>) => {
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
    setPage(1);
  };

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    cargarPreguntas(newPage);
  };

  // Eliminar pregunta
  const handleEliminarPregunta = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/core/preguntas/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar pregunta');
      }

      setPreguntas(prev => prev.filter(p => p.id !== id));
      
      addNotification({
        type: 'success',
        title: 'Éxito',
        message: 'Pregunta eliminada correctamente',
        duration: 3000,
      });

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al eliminar pregunta',
        duration: 5000,
      });
    }
  };

  // Duplicar pregunta
  const handleDuplicarPregunta = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/core/preguntas/${id}/duplicar/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al duplicar pregunta');
      }

      const nuevaPregunta = await response.json();
      setPreguntas(prev => [nuevaPregunta, ...prev]);
      
      addNotification({
        type: 'success',
        title: 'Éxito',
        message: 'Pregunta duplicada correctamente',
        duration: 3000,
      });

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al duplicar pregunta',
        duration: 5000,
      });
    }
  };

  // Renderizar contenido según la vista
  const renderContenido = () => {
    switch (vista) {
      case 'lista':
        return (
          <div className="space-y-6">
            <PreguntaFilters
              filtros={filtros}
              onChange={handleFiltrosChange}
            />
            
            <PreguntasList
              preguntas={preguntas}
              loading={loading}
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onEditar={(pregunta) => {
                setPreguntaEditando(pregunta);
                setVista('editar');
              }}
              onEliminar={handleEliminarPregunta}
              onDuplicar={handleDuplicarPregunta}
              onPageChange={handlePageChange}
            />
          </div>
        );

      case 'crear':
        return (
          <PreguntaForm
            onSave={(pregunta) => {
              setPreguntas(prev => [pregunta, ...prev]);
              setVista('lista');
              addNotification({
                type: 'success',
                title: 'Éxito',
                message: 'Pregunta creada correctamente',
                duration: 3000,
              });
            }}
            onCancel={() => setVista('lista')}
          />
        );

      case 'editar':
        return (
          <PreguntaForm
            pregunta={preguntaEditando}
            onSave={(preguntaActualizada) => {
              setPreguntas(prev => 
                prev.map(p => p.id === preguntaActualizada.id ? preguntaActualizada : p)
              );
              setVista('lista');
              setPreguntaEditando(null);
              addNotification({
                type: 'success',
                title: 'Éxito',
                message: 'Pregunta actualizada correctamente',
                duration: 3000,
              });
            }}
            onCancel={() => {
              setVista('lista');
              setPreguntaEditando(null);
            }}
          />
        );

      case 'carga-masiva':
        return <CargaMasivaPreguntas />;

      case 'estadisticas':
        return <PreguntasStats />;

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Preguntas
        </h1>
        <p className="text-gray-600">
          Administra el banco de preguntas: crear, editar, carga masiva y estadísticas
        </p>
      </div>

      {/* Navegación de vistas */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'lista', label: 'Lista de Preguntas', icon: '📋' },
              { key: 'crear', label: 'Crear Pregunta', icon: '➕' },
              { key: 'carga-masiva', label: 'Carga Masiva', icon: '📁' },
              { key: 'estadisticas', label: 'Estadísticas', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setVista(tab.key as Vista)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                  vista === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="min-h-[500px]">
        {renderContenido()}
      </div>
    </div>
  );
};

export default GestionPreguntasPage;