
import React, { useState, useEffect, useRef } from 'react';
import { FormField } from './FormField';

interface MultiSelectSubjectProps {
  id: string;
  label: string;
  value: string; // Stored as comma separated string
  onChange: (val: string) => void;
  options: string[]; // List of suggestions based on filter
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

export const MultiSelectSubject: React.FC<MultiSelectSubjectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  icon
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Convert comma-separated string to array
  const selectedItems = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addItem = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (!selectedItems.includes(trimmed)) {
      const newItems = [...selectedItems, trimmed];
      onChange(newItems.join(', '));
    }
    setInputValue('');
  };

  const removeItem = (itemToRemove: string) => {
    const newItems = selectedItems.filter(item => item !== itemToRemove);
    onChange(newItems.join(', '));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && selectedItems.length > 0) {
      removeItem(selectedItems[selectedItems.length - 1]);
    }
  };

  // Filter options:
  // 1. Hide already selected items
  // 2. Filter by input text (case insensitive)
  const displayedOptions = options.filter(opt => {
    const isSelected = selectedItems.includes(opt);
    const matchesInput = opt.toLowerCase().includes(inputValue.toLowerCase());
    return !isSelected && matchesInput;
  });

  return (
    <div className="mb-4" ref={wrapperRef}>
       <label htmlFor={id} className="flex items-center text-sm font-semibold text-gray-700 mb-1">
        {icon && <span className="mr-2 text-blue-600">{icon}</span>}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div 
        className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:outline-none bg-white flex flex-wrap gap-2 items-center relative"
        onClick={() => setIsDropdownOpen(true)}
      >
        {/* Render Selected Tags */}
        {selectedItems.map((item, idx) => (
          <span key={idx} className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-md flex items-center">
            {item}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeItem(item); }}
              className="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none"
            >
              &times;
            </button>
          </span>
        ))}

        {/* Input Field */}
        <input
          id={id}
          type="text"
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
          placeholder={selectedItems.length === 0 ? placeholder : ""}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsDropdownOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsDropdownOpen(true)}
          autoComplete="off"
        />

        {/* Dropdown Menu */}
        {isDropdownOpen && displayedOptions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
             <div className="text-xs text-gray-500 px-3 py-2 bg-gray-50 border-b">
                Gợi ý có sẵn:
             </div>
             {displayedOptions.map((opt, idx) => (
               <div
                 key={idx}
                 className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
                 onClick={() => {
                   addItem(opt);
                   // Keep dropdown open to allow selecting multiple
                 }}
               >
                 {opt}
               </div>
             ))}
          </div>
        )}
      </div>
      {displayedOptions.length === 0 && isDropdownOpen && inputValue && (
          <div className="text-xs text-gray-500 mt-1">
            Nhấn Enter để thêm "{inputValue}"
          </div>
      )}
    </div>
  );
};
