import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import type { Notification as NotificationType } from '../../types';
import { useNotifications } from '../../store';

interface NotificationProps {
  notification: NotificationType;
}

const Notification: React.FC<NotificationProps> = ({ notification }) => {
  const { removeNotification } = useNotifications();

  // const getIconClass = (type: string) => {
  //   const iconClasses = {
  //     success: 'text-success-500',
  //     error: 'text-error-500',
  //     warning: 'text-warning-500',
  //     info: 'text-primary-500',
  //   };
  //   return iconClasses[type as keyof typeof iconClasses] || 'text-gray-500';
  // };

  const bgClasses = {
    success: 'bg-success-50 border-success-200',
    error: 'bg-error-50 border-error-200',
    warning: 'bg-warning-50 border-warning-200',
    info: 'bg-primary-50 border-primary-200',
  };

  const getIcon = (type: NotificationType['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-error-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-primary-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-primary-500" />;
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 shadow-soft ${bgClasses[notification.type]} animate-slide-up`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon(notification.type)}
        </div>
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-700 mt-1">
            {notification.message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            type="button"
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={() => removeNotification(notification.id)}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification; 