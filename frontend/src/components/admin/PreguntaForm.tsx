import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import ImageUpload from '../ui/ImageUpload';
import { useNotifications } from '../../store';
import { api } from '../../services/api';

interface Materia {
  id: number;
  nombre: string;
  nombre_display: string;
}

interface Competencia {
  id: number;
  nombre: string;
}

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
  explicacion_opciones_incorrectas?: Record<string, string>;
  estrategias_resolucion?: string;
  errores_comunes?: string;
  dificultad: 'facil' | 'media' | 'dificil';
  tiempo_estimado: number;
  tags: string[];
  activa: boolean;
}

interface Props {
  pregunta?: Pregunta | null;
  onSave: (pregunta: Pregunta) => void;
  onCancel: () => void;
}

const PreguntaForm: React.FC<Props> = ({ pregunta, onSave, onCancel }) => {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Estado del formulario
  type FormDataState = {
    materia: string;
    competencia: string;
    contexto: string;
    enunciado: string;
    opciones: { A: string; B: string; C: string; D: string };
    respuesta_correcta: 'A' | 'B' | 'C' | 'D';
    retroalimentacion: string;
    explicacion: string;
    habilidad_evaluada: string;
    explicacion_opciones_incorrectas: { A: string; B: string; C: string; D: string };
    estrategias_resolucion: string;
    errores_comunes: string;
    dificultad: 'facil' | 'media' | 'dificil';
    tiempo_estimado: number;
    tags: string;
  };

  const [formData, setFormData] = useState<FormDataState>({
    materia: '',
    competencia: '',
    contexto: '',
    enunciado: '',
    opciones: {
      A: '',
      B: '',
      C: '',
      D: ''
    },
    respuesta_correcta: 'A',
    retroalimentacion: '',
    explicacion: '',
    habilidad_evaluada: '',
    explicacion_opciones_incorrectas: { A: '', B: '', C: '', D: '' },
    estrategias_resolucion: '',
    errores_comunes: '',
    dificultad: 'media',
    tiempo_estimado: 90,
    tags: ''
  });

  const [errores, setErrores] = useState<Record<string, string>>({});

  // Cargar materias al montar
  useEffect(() => {
    cargarMaterias();
  }, []);

  // Actualizar formulario cuando cambie la pregunta (para edición)
  useEffect(() => {
    if (pregunta) {
      const materiaId = pregunta.materia?.id?.toString() || '';
      const competenciaId = (pregunta.competencia as { id?: number } | undefined)?.id?.toString() || '';
      
      console.log('Actualizando formulario con pregunta:', {
        materiaId,
        competenciaId,
        materia: pregunta.materia,
        competencia: pregunta.competencia
      });
      
      setFormData({
        materia: materiaId,
        competencia: competenciaId,
        contexto: pregunta.contexto || '',
        enunciado: pregunta.enunciado || '',
        opciones: {
          A: pregunta.opciones?.A || '',
          B: pregunta.opciones?.B || '',
          C: pregunta.opciones?.C || '',
          D: pregunta.opciones?.D || ''
        },
        respuesta_correcta: pregunta.respuesta_correcta || 'A',
        retroalimentacion: pregunta.retroalimentacion || '',
        explicacion: pregunta.explicacion || '',
        habilidad_evaluada: pregunta.habilidad_evaluada || '',
        explicacion_opciones_incorrectas: {
          A: pregunta.explicacion_opciones_incorrectas?.A || '',
          B: pregunta.explicacion_opciones_incorrectas?.B || '',
          C: pregunta.explicacion_opciones_incorrectas?.C || '',
          D: pregunta.explicacion_opciones_incorrectas?.D || ''
        },
        estrategias_resolucion: pregunta.estrategias_resolucion || '',
        errores_comunes: pregunta.errores_comunes || '',
        dificultad: normalizarDificultad(pregunta.dificultad || 'media'),
        tiempo_estimado: pregunta.tiempo_estimado || 90,
        tags: pregunta.tags?.join(', ') || ''
      });
    }
  }, [pregunta]);

  // Cargar competencias cuando cambie la materia o cuando se carguen las materias
  useEffect(() => {
    console.log('useEffect competencias - formData.materia:', formData.materia, 'materias.length:', materias.length);
    if (formData.materia) {
      cargarCompetencias(formData.materia);
    } else {
      setCompetencias([]);
      setFormData(prev => ({ ...prev, competencia: '' }));
    }
  }, [formData.materia, materias.length]);

  // Establecer competencia cuando se carguen las competencias y haya una competencia guardada
  useEffect(() => {
    if (competencias.length > 0 && pregunta && pregunta.competencia) {
      const competenciaId = (pregunta.competencia as { id?: number } | undefined)?.id?.toString() || '';
      if (competenciaId && formData.competencia !== competenciaId) {
        console.log('Estableciendo competencia:', competenciaId, 'de competencias disponibles:', competencias);
        setFormData(prev => ({ ...prev, competencia: competenciaId }));
      }
    }
  }, [competencias, pregunta, formData.competencia]);

  const cargarMaterias = async () => {
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
        console.log('Materias cargadas:', materiasArray);
        setMaterias(materiasArray);
      } else {
        console.error('Error en respuesta de materias:', response.status);
        setMaterias([]);
      }
    } catch (error) {
      console.error('Error al cargar materias:', error);
      setMaterias([]);
    }
  };

  const cargarCompetencias = async (materiaId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('Cargando competencias para materia:', materiaId);
      const response = await fetch(`/api/core/competencias/?materia=${materiaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Manejar respuesta paginada o array directo
        const competenciasArray = Array.isArray(data) ? data : (data.results || []);
        console.log('Competencias cargadas:', competenciasArray);
        setCompetencias(competenciasArray);
      } else {
        console.error('Error en respuesta de competencias:', response.status);
        setCompetencias([]);
      }
    } catch (error) {
      console.error('Error al cargar competencias:', error);
      setCompetencias([]);
    }
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.materia) nuevosErrores.materia = 'La materia es requerida';
    if (!formData.enunciado.trim()) nuevosErrores.enunciado = 'El enunciado es requerido';
    if (!formData.retroalimentacion.trim()) nuevosErrores.retroalimentacion = 'La retroalimentación es requerida';

    // Validar opciones
    Object.entries(formData.opciones).forEach(([letra, texto]) => {
      if (!texto.trim()) {
        nuevosErrores[`opcion_${letra}`] = `La opción ${letra} es requerida`;
      }
    });

      // Validar que la respuesta correcta tenga contenido
  if (!formData.opciones[formData.respuesta_correcta as keyof typeof formData.opciones].trim()) {
    nuevosErrores.respuesta_correcta = 'La opción marcada como correcta debe tener contenido';
  }

    // Validar tiempo estimado
    if (formData.tiempo_estimado < 30 || formData.tiempo_estimado > 300) {
      nuevosErrores.tiempo_estimado = 'El tiempo debe estar entre 30 y 300 segundos';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      addNotification({
        type: 'error',
        title: 'Errores en el formulario',
        message: 'Por favor corrige los errores antes de continuar',
        duration: 5000,
      });
      return;
    }

    setLoading(true);

    try {


      // Siempre usar FormData para mantener consistencia
      const formDataToSend = new FormData();
      
      // Agregar todos los campos individualmente
      formDataToSend.append('materia', formData.materia);
      if (formData.competencia) {
        formDataToSend.append('competencia', formData.competencia);
      }
      formDataToSend.append('contexto', formData.contexto);
      formDataToSend.append('enunciado', formData.enunciado);
      formDataToSend.append('opciones', JSON.stringify(formData.opciones));
      formDataToSend.append('respuesta_correcta', formData.respuesta_correcta);
      formDataToSend.append('retroalimentacion', formData.retroalimentacion);
      formDataToSend.append('explicacion', formData.explicacion);
      formDataToSend.append('habilidad_evaluada', formData.habilidad_evaluada);
      formDataToSend.append('explicacion_opciones_incorrectas', JSON.stringify(formData.explicacion_opciones_incorrectas));
      formDataToSend.append('estrategias_resolucion', formData.estrategias_resolucion);
      formDataToSend.append('errores_comunes', formData.errores_comunes);
      // Asegurar que dificultad sea uno de los valores permitidos
      formDataToSend.append('dificultad', formData.dificultad);
      formDataToSend.append('tiempo_estimado', formData.tiempo_estimado.toString());
      formDataToSend.append('tags', JSON.stringify(formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)));
      formDataToSend.append('activa', 'true');

      // Agregar imagen si existe
      if (selectedImage) {
        formDataToSend.append('imagen', selectedImage);
      }

      // Log de los datos que se enviarán
      const formDataEntries: Record<string, string> = {};
      for (const [key, value] of formDataToSend.entries()) {
        formDataEntries[key] = value instanceof File ? `File: ${value.name}` : String(value);
      }
      console.log('FormData a enviar:', formDataEntries);
      
      const response = pregunta
        ? await api.put(`/core/preguntas/${pregunta.id}/`, formDataToSend)
        : await api.post('/core/preguntas/', formDataToSend);
      
      onSave(response.data);



    } catch (error: unknown) {
      const apiErr = error as { response?: { data?: { detail?: string } } };
      const message = apiErr.response?.data?.detail || (error instanceof Error ? error.message : 'Error al guardar la pregunta');
      addNotification({
        type: 'error',
        title: 'Error',
        message,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = <K extends keyof FormDataState>(field: K, value: FormDataState[K]) => {
    // Normalizar dificultad si es necesario
    const normalizedValue = field === 'dificultad' && typeof value === 'string' ? normalizarDificultad(value) : value;
    
    setFormData(prev => ({ ...prev, [field]: normalizedValue }));
    
    // Limpiar error si existe
    if (errores[String(field)]) {
      setErrores(prev => ({ ...prev, [String(field)]: '' }));
    }
  };

  // Normalizar dificultad a uno de los valores permitidos
  const normalizarDificultad = (dificultad: string): 'facil' | 'media' | 'dificil' => {
    switch (dificultad.toLowerCase()) {
      case 'fácil':
      case 'facil':
      case 'baja':
        return 'facil';
      case 'media':
      case 'medio':
      case 'normal':
        return 'media';
      case 'difícil':
      case 'dificil':
      case 'alta':
        return 'dificil';
      default:
        return 'media';
    }
  };

  const handleOpcionChange = (letra: 'A' | 'B' | 'C' | 'D', valor: string) => {
    setFormData(prev => ({
      ...prev,
      opciones: { ...prev.opciones, [letra]: valor }
    }));
    
    // Limpiar error si existe
    if (errores[`opcion_${letra}`]) {
      setErrores(prev => ({ ...prev, [`opcion_${letra}`]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title={pregunta ? 'Editar Pregunta' : 'Crear Nueva Pregunta'}>
        <div className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Materia *
              </label>
              <select
                value={formData.materia}
                onChange={(e) => handleInputChange('materia', e.target.value)}
                className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errores.materia ? 'border-red-300' : ''
                }`}
                required
              >
                <option value="">Seleccionar materia</option>
                {Array.isArray(materias) && materias.map((materia) => (
                  <option key={materia.id} value={materia.id}>
                    {materia.nombre_display}
                  </option>
                ))}
              </select>
              {errores.materia && (
                <p className="mt-1 text-sm text-red-600">{errores.materia}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Competencia
              </label>
              <select
                value={formData.competencia}
                onChange={(e) => handleInputChange('competencia', e.target.value)}
                disabled={!formData.materia}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                onFocus={() => console.log('Select competencia - valor actual:', formData.competencia, 'competencias disponibles:', competencias)}
                onMouseEnter={() => console.log('Mouse enter competencia - formData.competencia:', formData.competencia, 'competencias count:', competencias.length)}
              >
                <option value="">Seleccionar competencia</option>
                {Array.isArray(competencias) && competencias.map((competencia) => (
                  <option key={competencia.id} value={competencia.id}>
                    {competencia.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contexto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contexto
            </label>
            <textarea
              value={formData.contexto}
              onChange={(e) => handleInputChange('contexto', e.target.value)}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Contexto o situación de la pregunta (opcional)"
            />
          </div>

          {/* Imagen de contexto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen de Contexto
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Sube una imagen opcional para análisis, gráficos, diagramas, mapas, etc.
            </p>
            <ImageUpload
              onImageSelect={setSelectedImage}
              currentImageUrl={pregunta?.imagen_url}
              disabled={loading}
              maxSizeMB={5}
            />
          </div>

          {/* Enunciado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enunciado de la pregunta *
            </label>
            <textarea
              value={formData.enunciado}
              onChange={(e) => handleInputChange('enunciado', e.target.value)}
              rows={3}
              className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                errores.enunciado ? 'border-red-300' : ''
              }`}
              placeholder="Escribe aquí la pregunta"
              required
            />
            {errores.enunciado && (
              <p className="mt-1 text-sm text-red-600">{errores.enunciado}</p>
            )}
          </div>

          {/* Opciones de respuesta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Opciones de respuesta *
            </label>
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((letra) => (
                <div key={letra} className="flex items-start space-x-3">
                  <div className="flex items-center pt-2">
                    <input
                      type="radio"
                      name="respuesta_correcta"
                      value={letra}
                      checked={formData.respuesta_correcta === letra}
                      onChange={(e) => handleInputChange('respuesta_correcta', e.target.value)}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      {letra})
                    </label>
                  </div>
                  <div className="flex-1">
                <Input
                       type="text" 
                       name={`opcion_${letra}`}
                       value={formData.opciones[letra as keyof typeof formData.opciones]}
                  onChange={(value) => handleOpcionChange(letra as 'A'|'B'|'C'|'D', value)}
                       placeholder={`Opción ${letra}`}
                       className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errores[`opcion_${letra}`] ? 'border-red-300' : ''}`}
                       required
                     />
                    {errores[`opcion_${letra}`] && (
                      <p className="mt-1 text-sm text-red-600">{errores[`opcion_${letra}`]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {errores.respuesta_correcta && (
              <p className="mt-1 text-sm text-red-600">{errores.respuesta_correcta}</p>
            )}
          </div>

          {/* Retroalimentación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Retroalimentación *
            </label>
            <textarea
              value={formData.retroalimentacion}
              onChange={(e) => handleInputChange('retroalimentacion', e.target.value)}
              rows={3}
              className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                errores.retroalimentacion ? 'border-red-300' : ''
              }`}
              placeholder="Explicación de por qué la respuesta es correcta"
              required
            />
            {errores.retroalimentacion && (
              <p className="mt-1 text-sm text-red-600">{errores.retroalimentacion}</p>
            )}
          </div>

          {/* Explicación adicional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Explicación adicional
            </label>
            <textarea
              value={formData.explicacion}
              onChange={(e) => handleInputChange('explicacion', e.target.value)}
              rows={2}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Explicación más detallada (opcional)"
            />
          </div>

          {/* Configuración */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dificultad
              </label>
              <select
                value={formData.dificultad}
                onChange={(e) => handleInputChange('dificultad', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="facil">Fácil</option>
                <option value="media">Media</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo estimado (segundos)
              </label>
                             <input
                 type="number"
                 name="tiempo_estimado"
                 min="30"
                 max="300"
                 value={formData.tiempo_estimado}
                 onChange={(e) => handleInputChange('tiempo_estimado', parseInt(e.target.value))}
                 className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errores.tiempo_estimado ? 'border-red-300' : ''}`}
               />
              {errores.tiempo_estimado && (
                <p className="mt-1 text-sm text-red-600">{errores.tiempo_estimado}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (separados por coma)
              </label>
                             <Input
                 type="text"
                 name="tags"
                 value={formData.tags}
                 onChange={(value) => handleInputChange('tags', value)}
                 placeholder="álgebra, ecuaciones, básico"
               />
            </div>
          </div>

          {/* Habilidad evaluada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Habilidad evaluada
            </label>
                         <Input
               type="text"
               name="habilidad_evaluada"
               value={formData.habilidad_evaluada}
               onChange={(value) => handleInputChange('habilidad_evaluada', value)}
               placeholder="Descripción de la competencia específica que evalúa"
             />
          </div>

          {/* Explicaciones de opciones incorrectas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Explicaciones de opciones incorrectas
            </label>
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((letra) => (
                <div key={letra} className="flex items-start space-x-3">
                  <div className="flex items-center pt-2">
                    <label className="text-sm font-medium text-gray-700 w-8">
                      {letra})
                    </label>
                  </div>
                  <div className="flex-1">
                <Input
                       type="text"
                       name={`explicacion_${letra}`}
                       value={formData.explicacion_opciones_incorrectas[letra as keyof typeof formData.explicacion_opciones_incorrectas]}
                       onChange={(value) => handleInputChange('explicacion_opciones_incorrectas', {
                         ...formData.explicacion_opciones_incorrectas,
                         [letra]: value
                       })}
                       placeholder={`Explicación de por qué la opción ${letra} es incorrecta`}
                     />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Estrategias de resolución */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estrategias de resolución
            </label>
            <textarea
              value={formData.estrategias_resolucion}
              onChange={(e) => handleInputChange('estrategias_resolucion', e.target.value)}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Pasos o estrategias para resolver este tipo de pregunta"
            />
          </div>

          {/* Errores comunes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Errores comunes
            </label>
            <textarea
              value={formData.errores_comunes}
              onChange={(e) => handleInputChange('errores_comunes', e.target.value)}
              rows={2}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Errores frecuentes que cometen los estudiantes"
            />
          </div>
        </div>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Guardando...
            </div>
          ) : (
            pregunta ? 'Actualizar Pregunta' : 'Crear Pregunta'
          )}
        </Button>
      </div>
    </form>
  );
};

export default PreguntaForm;