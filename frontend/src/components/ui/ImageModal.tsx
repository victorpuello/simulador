import React from 'react';

interface ImageModalProps {
  isOpen: boolean;
  src: string;
  alt?: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, src, alt = 'Imagen', onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative">
          <img
            src={src}
            alt={alt}
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg shadow-2xl"
          />
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 bg-white text-gray-700 rounded-full shadow p-2 hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;

