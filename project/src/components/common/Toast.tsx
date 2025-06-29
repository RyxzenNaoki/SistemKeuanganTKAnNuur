import { X } from 'lucide-react';
import { ToastType } from '../../contexts/ToastContext';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
}

const Toast = ({ type, message, onClose }: ToastProps) => {
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-success-50 text-success-800 border-success-500';
      case 'error':
        return 'bg-error-50 text-error-800 border-error-500';
      case 'warning':
        return 'bg-warning-50 text-warning-800 border-warning-500';
      case 'info':
        return 'bg-primary-50 text-primary-800 border-primary-500';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-500';
    }
  };

  return (
    <div
      className={`rounded-lg border-l-4 p-4 shadow-md animate-slide-up ${getToastStyles()}`}
      role="alert"
    >
      <div className="flex items-center justify-between">
        <p className="font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;