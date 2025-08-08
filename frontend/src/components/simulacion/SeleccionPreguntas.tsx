import React, { useState, useEffect, useCallback } from 'react';
import type { Pregunta } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useNotifications } from '../../store';

interface Props {
  materiaId: number;
  onSeleccionarPreguntas: (preguntasIds: number[]) => void;
  onCancelar: () => void;
}

const SeleccionPreguntas: React.FC<Props> = ({ materiaId, onSeleccionarPreguntas, onCancelar }) => {
  const { addNotification } = useNotifications();
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [preguntasSeleccionadas, setPreguntasSeleccionadas] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const cargarPreguntas = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/core/preguntas/?materia=${materiaId}&activa=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const preguntasArray = Array.isArray(data) ? data : (data.results || []);
        setPreguntas(preguntasArray);
      } else {
        console.error('Error al cargar preguntas:', response.status);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No se pudieron cargar las preguntas',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error al cargar preguntas:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Ocurrió un error al cargar las preguntas',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification, materiaId]);

  useEffect(() => {
    cargarPreguntas();
  }, [materiaId, cargarPreguntas]);

  const togglePregunta = (preguntaId: number) => {
    const nuevasSeleccionadas = new Set(preguntasSeleccionadas);
    if (nuevasSeleccionadas.has(preguntaId)) {
      nuevasSeleccionadas.delete(preguntaId);
    } else {
      nuevasSeleccionadas.add(preguntaId);
    }
    setPreguntasSeleccionadas(nuevasSeleccionadas);
  };

  const handleConfirmar = () => {
    if (preguntasSeleccionadas.size < 5) {
      addNotification({
        type: 'warning',
        title: 'Atención',
        message: 'Debes seleccionar al menos 5 preguntas',
        duration: 3000,
      });
      return;
    }
    onSeleccionarPreguntas(Array.from(preguntasSeleccionadas));
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Selecciona las preguntas para la simulación
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando preguntas...</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {preguntasSeleccionadas.size} preguntas seleccionadas
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreguntasSeleccionadas(new Set())}
              >
                Limpiar selección
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
              {preguntas.map((pregunta) => (
                <div
                  key={pregunta.id}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-colors
                    ${preguntasSeleccionadas.has(pregunta.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                  `}
                  onClick={() => togglePregunta(pregunta.id)}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={preguntasSeleccionadas.has(pregunta.id)}
                      onChange={() => togglePregunta(pregunta.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {pregunta.enunciado}
                      </p>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Dificultad: {pregunta.dificultad}</span>
                        <span>•</span>
                        <span>Tiempo: {pregunta.tiempo_estimado}s</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={onCancelar}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmar}
                disabled={preguntasSeleccionadas.size < 5}
              >
                Confirmar selección
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default SeleccionPreguntas;