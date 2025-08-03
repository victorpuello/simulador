import React, { useState, useRef } from 'react';
import Button from './Button';

interface Props {
  onImageSelect: (file: File | null) => void;
  currentImageUrl?: string | null;
  disabled?: boolean;
  maxSizeMB?: number;
  acceptedFormats?: string[];
}

const ImageUpload: React.FC<Props> = ({
  onImageSelect,
  currentImageUrl,
  disabled = false,
  maxSizeMB = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
}) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Validar formato
    if (!acceptedFormats.includes(file.type)) {
      return `Formato no soportado. Use: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`;
    }

    // Validar tamaño
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return `La imagen es muy grande. Máximo ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFileSelect = (file: File | null) => {
    setError('');
    
    if (!file) {
      setPreview(null);
      onImageSelect(null);
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    onImageSelect(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = () => {
    setPreview(null);
    setError('');
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-3">
      {/* Área de subida */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        {preview ? (
          <div className="space-y-3">
            {/* Vista previa de la imagen */}
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Vista previa"
                className="max-w-full max-h-64 rounded-lg shadow-sm"
                style={{ objectFit: 'contain' }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage();
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                disabled={disabled}
              >
                ×
              </button>
            </div>
            
            {!disabled && (
              <p className="text-sm text-gray-500">
                Haz clic para cambiar la imagen
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl text-gray-400">📷</div>
            
            {!disabled ? (
              <>
                <p className="text-gray-600">
                  <span className="font-medium">Haz clic para subir</span> o arrastra una imagen aquí
                </p>
                <p className="text-sm text-gray-400">
                  PNG, JPG, WEBP o GIF hasta {maxSizeMB}MB
                </p>
              </>
            ) : (
              <p className="text-gray-400">Sin imagen</p>
            )}
          </div>
        )}

        {/* Input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Botones de acción */}
      {preview && !disabled && (
        <div className="flex justify-center space-x-2">
          <Button
            type="button"
            variant="secondary"
            onClick={openFileDialog}
            className="text-sm px-3 py-1"
          >
            Cambiar imagen
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={removeImage}
            className="text-sm px-3 py-1"
          >
            Quitar imagen
          </Button>
        </div>
      )}

      {/* Información adicional */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Formatos soportados: JPEG, PNG, WebP, GIF</p>
        <p>• Tamaño máximo: {maxSizeMB}MB</p>
        <p>• Se recomienda usar imágenes claras y de alta resolución</p>
      </div>
    </div>
  );
};

export default ImageUpload;