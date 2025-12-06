import React, { useState, useRef, useEffect, useMemo } from 'react';

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  id?: string;
  autoFocus?: boolean;
}

export const Combobox: React.FC<ComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  id,
  autoFocus
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'filter' | 'all'>('filter');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setFilterMode('filter');
    setIsOpen(true);
  };

  const handleInputClick = () => {
    if (!isOpen) {
       setIsOpen(true);
       setFilterMode('filter'); 
    }
  };

  const toggleDropdown = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
      setFilterMode('all'); // Explicitly show all options when chevron is clicked
      inputRef.current?.focus();
    }
  };

  const handleOptionClick = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const filteredOptions = useMemo(() => {
    if (filterMode === 'all') return options;
    
    // Filter mode
    if (!value) return options;
    const lowerValue = value.toLowerCase();
    return options.filter(opt => opt.toLowerCase().includes(lowerValue));
  }, [options, value, filterMode]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          type="text"
          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors bg-white"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onFocus={handleInputClick} 
          autoComplete="off"
          autoFocus={autoFocus}
        />
        
        {/* Chevron / Toggle Button */}
        <button
          type="button"
          onClick={toggleDropdown}
          className="absolute right-0 top-0 bottom-0 px-2 text-gray-500 hover:text-blue-600 focus:outline-none cursor-pointer flex items-center justify-center bg-transparent"
          tabIndex={-1}
        >
          <svg className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown List */}
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto animate-fade-in-up">
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm text-gray-700 transition-colors border-b border-gray-100 last:border-0"
              onClick={() => handleOptionClick(option)}
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur
            >
              {option}
            </div>
          ))}
        </div>
      )}
      
      {/* Đã loại bỏ phần hiển thị "Không tìm thấy kết quả" để tránh gây hiểu nhầm là lỗi */}
    </div>
  );
};