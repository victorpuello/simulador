import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useNotifications } from '../../store';

interface ResultadoCarga {
  mensaje: string;
  total_procesadas: number;
  exitosas: number;
  errores: number;
  detalles: Array<{
    fila: number;
    estado: 'exitosa' | 'error';
    id_pregunta?: number;
    mensaje: string;
  }>;
}

const CargaMasivaPreguntas: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCarga | null>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  // Verificar permisos
  if (!user || !['docente', 'admin'].includes(user.rol) && !user.is_staff) {
    return (
      <Card title="Acceso Restringido">
        <p className="text-gray-600">
          No tienes permisos para acceder a esta funcionalidad. 
          Solo los profesores y administradores pueden cargar preguntas masivamente.
        </p>
      </Card>
    );
  }

  const manejarSeleccionArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivoSeleccionado = event.target.files?.[0];
    if (archivoSeleccionado) {
      if (!archivoSeleccionado.name.endsWith('.json')) {
        addNotification({
          type: 'error',
          title: 'Archivo inválido',
          message: 'Por favor selecciona un archivo JSON (.json)',
          duration: 5000,
        });
        return;
      }
      setArchivo(archivoSeleccionado);
      setResultado(null);
    }
  };

  const descargarPlantilla = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/core/preguntas/plantilla_carga/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al descargar la plantilla');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_preguntas.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addNotification({
        type: 'success',
        title: 'Plantilla descargada',
        message: 'La plantilla se ha descargado correctamente',
        duration: 3000,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo descargar la plantilla',
        duration: 5000,
      });
    }
  };

  const subirArchivo = async () => {
    if (!archivo) {
      addNotification({
        type: 'error',
        title: 'Sin archivo',
        message: 'Por favor selecciona un archivo JSON',
        duration: 5000,
      });
      return;
    }

    setCargando(true);
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);

      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/core/preguntas/carga_masiva/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la carga');
      }

      setResultado(data);
      addNotification({
        type: data.errores > 0 ? 'warning' : 'success',
        title: 'Carga completada',
        message: `${data.exitosas} preguntas cargadas exitosamente${data.errores > 0 ? `, ${data.errores} errores` : ''}`,
        duration: 5000,
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error en la carga',
        message: error.message || 'Error desconocido',
        duration: 5000,
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Carga Masiva de Preguntas">
        <div className="space-y-4">
          <div>
            <p className="text-gray-600 mb-4">
              Carga múltiples preguntas de una vez utilizando un archivo JSON. 
              Descarga la plantilla para ver el formato requerido.
            </p>
            
            <div className="flex gap-4 mb-4">
              <Button
                variant="secondary"
                onClick={descargarPlantilla}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Descargar Plantilla
              </Button>
            </div>
          </div>

          <div>
            <label htmlFor="archivo" className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar archivo JSON
            </label>
            <input
              id="archivo"
              type="file"
              accept=".json"
              onChange={manejarSeleccionArchivo}
              className="block w-full text-sm text-gray-500 
                file:mr-4 file:py-2 file:px-4 
                file:rounded-full file:border-0 
                file:text-sm file:font-semibold 
                file:bg-blue-50 file:text-blue-700 
                hover:file:bg-blue-100"
            />
            {archivo && (
              <p className="mt-2 text-sm text-green-600">
                Archivo seleccionado: {archivo.name}
              </p>
            )}
          </div>

          <Button
            variant="primary"
            onClick={subirArchivo}
            disabled={!archivo || cargando}
            className="w-full"
          >
            {cargando ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Procesando...
              </div>
            ) : (
              'Cargar Preguntas'
            )}
          </Button>
        </div>
      </Card>

      {resultado && (
        <Card title="Resultado de la Carga">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-green-800 font-semibold text-lg">
                  {resultado.exitosas}
                </div>
                <div className="text-green-600 text-sm">Exitosas</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-red-800 font-semibold text-lg">
                  {resultado.errores}
                </div>
                <div className="text-red-600 text-sm">Errores</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-blue-800 font-semibold text-lg">
                  {resultado.total_procesadas}
                </div>
                <div className="text-blue-600 text-sm">Total</div>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => setMostrarDetalles(!mostrarDetalles)}
              className="w-full"
            >
              {mostrarDetalles ? 'Ocultar' : 'Mostrar'} Detalles
            </Button>

            {mostrarDetalles && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Detalles por pregunta:</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {resultado.detalles.map((detalle, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg text-sm ${
                        detalle.estado === 'exitosa'
                          ? 'bg-green-50 text-green-800'
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      <div className="font-medium">
                        Fila {detalle.fila}: {detalle.estado === 'exitosa' ? '✓' : '✗'}
                      </div>
                      <div className="text-xs opacity-75">
                        {detalle.mensaje}
                        {detalle.id_pregunta && ` (ID: ${detalle.id_pregunta})`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card title="Formato del Archivo JSON">
        <div className="space-y-2 text-sm text-gray-600">
          <h4 className="font-semibold text-gray-800">Campos requeridos:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>materia:</strong> Nombre de la materia (se crea automáticamente si no existe)</li>
            <li><strong>enunciado:</strong> Texto de la pregunta</li>
            <li><strong>opciones:</strong> Objeto con las opciones (A, B, C, D)</li>
            <li><strong>respuesta_correcta:</strong> Letra de la respuesta correcta</li>
            <li><strong>retroalimentacion:</strong> Explicación de la respuesta</li>
          </ul>
          
          <h4 className="font-semibold text-gray-800 mt-4">Campos opcionales:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>competencia:</strong> Nombre de la competencia</li>
            <li><strong>contexto:</strong> Contexto o situación de la pregunta</li>
            <li><strong>explicacion:</strong> Explicación adicional</li>
            <li><strong>dificultad:</strong> "facil", "media" o "dificil" (por defecto: "media")</li>
            <li><strong>tiempo_estimado:</strong> Tiempo en segundos (por defecto: 60)</li>
            <li><strong>tags:</strong> Array de etiquetas</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default CargaMasivaPreguntas;