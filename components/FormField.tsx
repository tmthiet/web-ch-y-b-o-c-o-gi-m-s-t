import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, htmlFor, required, children, icon }) => {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="flex items-center text-sm font-semibold text-gray-700 mb-1">
        {icon && <span className="mr-2 text-blue-600">{icon}</span>}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
};