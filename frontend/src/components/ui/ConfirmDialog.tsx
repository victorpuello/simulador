import React from 'react';
import Button from './Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost' | 'danger';
}

const ConfirmDialog: React.FC<Props> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onClose,
  variant = 'primary'
}) => {
  if (!isOpen) return null;

  const getIcon = () => (variant === 'danger' ? '🗑️' : variant === 'warning' ? '⚠️' : 'ℹ️');

  // Nota: botón de confirmar usa variant mapeado directamente más abajo

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          <div className="p-6">
            {/* Icon and Title */}
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">{getIcon()}</div>
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            </div>
            
            {/* Message */}
            <p className="text-gray-600 mb-6">{message}</p>
            
            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={onClose}
              >
                {cancelText}
              </Button>
              <Button
                variant={variant === 'danger' ? 'error' : variant}
                onClick={onConfirm}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;