import React, { useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import ConfirmDialog from '../ui/ConfirmDialog';
import Pagination from '../ui/Pagination';

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

interface Props {
  preguntas: Pregunta[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onEditar: (pregunta: Pregunta) => void;
  onEliminar: (id: number) => void;
  onDuplicar: (id: number) => void;
  onPageChange: (page: number) => void;
}

const PreguntasList: React.FC<Props> = ({
  preguntas,
  loading,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onEditar,
  onEliminar,
  onDuplicar,
  onPageChange
}) => {
  const [preguntaAEliminar, setPreguntaAEliminar] = useState<number | null>(null);
  const [preguntaExpandida, setPreguntaExpandida] = useState<number | null>(null);

  const getDificultadColor = (dificultad: string) => {
    switch (dificultad) {
      case 'facil':
        return 'bg-green-100 text-green-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'dificil':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDificultadLabel = (dificultad: string) => {
    switch (dificultad) {
      case 'facil':
        return 'Fácil';
      case 'media':
        return 'Media';
      case 'dificil':
        return 'Difícil';
      default:
        return dificultad;
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading && preguntas.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (preguntas.length === 0) {
    return (
      <Card title="Sin preguntas">
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron preguntas
          </h3>
          <p className="text-gray-600">
            Intenta ajustar los filtros de búsqueda o crear una nueva pregunta.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lista de preguntas */}
      {preguntas.map((pregunta) => (
        <Card key={pregunta.id}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Header de la pregunta */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {pregunta.materia.nombre_display}
                  </span>
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDificultadColor(pregunta.dificultad)}`}>
                    {getDificultadLabel(pregunta.dificultad)}
                  </span>
                  
                  {!pregunta.activa && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inactiva
                    </span>
                  )}
                  
                  <span className="text-xs text-gray-500">
                    {pregunta.tiempo_estimado}s
                  </span>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPreguntaExpandida(
                      preguntaExpandida === pregunta.id ? null : pregunta.id
                    )}
                    className="text-xs px-2 py-1"
                  >
                    {preguntaExpandida === pregunta.id ? 'Colapsar' : 'Ver más'}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={() => onEditar(pregunta)}
                    className="text-xs px-2 py-1"
                  >
                    ✏️ Editar
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={() => onDuplicar(pregunta.id)}
                    className="text-xs px-2 py-1"
                  >
                    📋 Duplicar
                  </Button>
                  
                  <Button
                    variant="danger"
                    onClick={() => setPreguntaAEliminar(pregunta.id)}
                    className="text-xs px-2 py-1"
                  >
                    🗑️ Eliminar
                  </Button>
                </div>
              </div>

              {/* Competencia */}
              {pregunta.competencia && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Competencia:</strong> {pregunta.competencia.nombre}
                </p>
              )}

              {/* Contexto */}
              {pregunta.contexto && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Contexto:</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {preguntaExpandida === pregunta.id ? pregunta.contexto : truncateText(pregunta.contexto, 200)}
                  </p>
                </div>
              )}

              {/* Imagen de contexto */}
              {pregunta.imagen_url && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Imagen de Contexto:</p>
                  <div className="flex justify-center">
                    <img
                      src={pregunta.imagen_url}
                      alt="Imagen de contexto"
                      className="max-w-full max-h-64 rounded-lg shadow-sm border border-gray-200"
                      style={{ objectFit: 'contain' }}
                      onClick={() => {
                        // Abrir imagen en nueva ventana para vista completa
                        window.open(pregunta.imagen_url, '_blank');
                      }}
                      onError={(e) => {
                        // Ocultar imagen si no se puede cargar
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    Haz clic para ver en tamaño completo
                  </p>
                </div>
              )}

              {/* Enunciado */}
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Pregunta:</p>
                <p className="text-gray-900">
                  {preguntaExpandida === pregunta.id ? pregunta.enunciado : truncateText(pregunta.enunciado, 300)}
                </p>
              </div>

              {/* Opciones (siempre expandidas en vista resumida) */}
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Opciones:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(pregunta.opciones).map(([letra, texto]) => (
                    <div
                      key={letra}
                      className={`p-2 rounded text-sm ${
                        letra === pregunta.respuesta_correcta
                          ? 'bg-green-50 border border-green-200 text-green-800'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <span className="font-medium">{letra})</span> {texto}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contenido expandido */}
              {preguntaExpandida === pregunta.id && (
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  {/* Retroalimentación */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Retroalimentación:</p>
                    <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                      {pregunta.retroalimentacion}
                    </p>
                  </div>

                  {/* Explicación */}
                  {pregunta.explicacion && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Explicación:</p>
                      <p className="text-sm text-gray-600">
                        {pregunta.explicacion}
                      </p>
                    </div>
                  )}

                  {/* Habilidad evaluada */}
                  {pregunta.habilidad_evaluada && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Habilidad evaluada:</p>
                      <p className="text-sm text-gray-600">
                        {pregunta.habilidad_evaluada}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {pregunta.tags && pregunta.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {pregunta.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        className="mt-6"
      />

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={preguntaAEliminar !== null}
        title="Eliminar Pregunta"
        message="¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => {
          if (preguntaAEliminar) {
            onEliminar(preguntaAEliminar);
            setPreguntaAEliminar(null);
          }
        }}
        onCancel={() => setPreguntaAEliminar(null)}
        type="danger"
      />
    </div>
  );
};

export default PreguntasList;