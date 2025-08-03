import React from 'react';
import { clsx } from 'clsx';
import type { InputProps } from '../../types';

const Input: React.FC<InputProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  error,
  value,
  onChange,
  className = '',
}) => {
  const inputClasses = clsx(
    'input',
    error && 'border-error-500 focus:ring-error-500 focus:border-error-500',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={inputClasses}
      />
      {error && (
        <p className="text-sm text-error-600 mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input; 