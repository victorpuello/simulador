import React, { useState, useEffect, useCallback } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface Materia {
  id: number;
  nombre: string;
  nombre_display: string;
}

interface Competencia {
  id: number;
  nombre: string;
}

interface Filtros {
  materia: string;
  competencia: string;
  dificultad: string;
  busqueda: string;
  mostrar_inactivas: boolean;
}

interface Props {
  filtros: Filtros;
  onChange: (filtros: Partial<Filtros>) => void;
}

const PreguntaFilters: React.FC<Props> = ({ filtros, onChange }) => {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [competencias, setCompetencias] = useState<Competencia[]>([]);

  const cargarMaterias = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/core/materias/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Manejar respuesta paginada o array directo
        const materiasArray = Array.isArray(data) ? data : (data.results || []);
        setMaterias(materiasArray);
      } else {
        console.error('Error en respuesta de materias:', response.status);
        setMaterias([]);
      }
    } catch (error) {
      console.error('Error al cargar materias:', error);
      setMaterias([]);
    }
  }, []);

  const cargarCompetencias = useCallback(async (materiaId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/core/competencias/?materia=${materiaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Manejar respuesta paginada o array directo
        const competenciasArray = Array.isArray(data) ? data : (data.results || []);
        setCompetencias(competenciasArray);
      } else {
        console.error('Error en respuesta de competencias:', response.status);
        setCompetencias([]);
      }
    } catch (error) {
      console.error('Error al cargar competencias:', error);
      setCompetencias([]);
    }
  }, []);

  // Cargar materias al montar
  useEffect(() => {
    cargarMaterias();
  }, [cargarMaterias]);

  // Cargar competencias cuando cambie la materia
  useEffect(() => {
    if (filtros.materia) {
      cargarCompetencias(filtros.materia);
    } else {
      setCompetencias([]);
      onChange({ competencia: '' });
    }
  }, [filtros.materia, cargarCompetencias, onChange]);

  const limpiarFiltros = () => {
    onChange({
      materia: '',
      competencia: '',
      dificultad: '',
      busqueda: '',
      mostrar_inactivas: false
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filtros de Búsqueda</h3>
        <Button
          variant="secondary"
          onClick={limpiarFiltros}
          className="text-sm"
        >
          Limpiar Filtros
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Búsqueda por texto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar en texto
          </label>
          <Input
            name="busqueda"
            type="text"
            placeholder="Buscar en enunciado, contexto..."
            value={filtros.busqueda}
            onChange={(value) => onChange({ busqueda: value })}
            className="w-full"
          />
        </div>

        {/* Filtro por materia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Materia
          </label>
          <select
            value={filtros.materia}
            onChange={(e) => onChange({ materia: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Todas las materias</option>
            {Array.isArray(materias) && materias.map((materia) => (
              <option key={materia.id} value={materia.id}>
                {materia.nombre_display}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por competencia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Competencia
          </label>
          <select
            value={filtros.competencia}
            onChange={(e) => onChange({ competencia: e.target.value })}
            disabled={!filtros.materia}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Todas las competencias</option>
            {Array.isArray(competencias) && competencias.map((competencia) => (
              <option key={competencia.id} value={competencia.id}>
                {competencia.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por dificultad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dificultad
          </label>
          <select
            value={filtros.dificultad}
            onChange={(e) => onChange({ dificultad: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Todas las dificultades</option>
            <option value="facil">Fácil</option>
            <option value="media">Media</option>
            <option value="dificil">Difícil</option>
          </select>
        </div>
      </div>

      {/* Opciones adicionales */}
      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filtros.mostrar_inactivas}
            onChange={(e) => onChange({ mostrar_inactivas: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">
            Mostrar preguntas inactivas
          </span>
        </label>
      </div>

      {/* Contadores activos */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filtros.busqueda && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Búsqueda: "{filtros.busqueda}"
            <button
              onClick={() => onChange({ busqueda: '' })}
              className="ml-1 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        )}
        
        {filtros.materia && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Materia: {Array.isArray(materias) ? materias.find(m => m.id.toString() === filtros.materia)?.nombre_display : 'Cargando...'}
            <button
              onClick={() => onChange({ materia: '' })}
              className="ml-1 text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </span>
        )}
        
        {filtros.dificultad && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Dificultad: {filtros.dificultad}
            <button
              onClick={() => onChange({ dificultad: '' })}
              className="ml-1 text-purple-600 hover:text-purple-800"
            >
              ×
            </button>
          </span>
        )}
      </div>
    </div>
  );
};

export default PreguntaFilters;