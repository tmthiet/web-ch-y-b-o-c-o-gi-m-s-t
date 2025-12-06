import React from 'react';
import { FormField } from './FormField';

interface IncidentInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  hasIncident: boolean;
}

export const IncidentInput: React.FC<IncidentInputProps> = ({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder,
  hasIncident 
}) => {
  return (
    <div className={`transition-all duration-300 ${hasIncident ? 'bg-red-50 p-3 rounded-lg border border-red-200' : 'bg-white'}`}>
      <FormField label={label} htmlFor={id} icon={
        hasIncident ? (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        ) : (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        )
      }>
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          rows={hasIncident ? 3 : 2}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            hasIncident ? 'border-red-300 bg-white' : 'border-gray-300'
          }`}
          placeholder={placeholder}
        />
      </FormField>
    </div>
  );
};