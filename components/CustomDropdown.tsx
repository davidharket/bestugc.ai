// components/CustomDropdown.tsx
import React, { useState, useEffect, useRef } from 'react';

// Make the component generic to handle any kind of option object
interface CustomDropdownProps<T> {
  value: string;
  options: T[];
  onChange: (value: string) => void;
  // Specify which keys on the option object to use for value and display
  valueKey: keyof T;
  labelKey: keyof T;
  // A function to custom-render an option, allowing for things like play buttons
  renderOption?: (
    option: T,
    isSelected: boolean,
    actions: { close: () => void }
  ) => React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
}

const CustomDropdown = <T extends { [key: string]: any }>({
  value,
  options,
  onChange,
  valueKey,
  labelKey,
  renderOption,
  placeholder,
  disabled = false,
}: CustomDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt[valueKey] === value);

  const closeDropdown = () => setIsOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm text-left flex items-center justify-between transition-colors ${
          disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-gray-600 focus:border-orange-500 focus:outline-none'
        }`}
        disabled={disabled}
      >
        <span className="truncate">{selectedOption ? selectedOption[labelKey] : placeholder}</span>
        <svg className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option, index) => {
            const isSelected = selectedOption && selectedOption[valueKey] === option[valueKey];
            if (renderOption) {
              // If a custom render function is provided, use it
              return renderOption(option, !!isSelected, { close: closeDropdown });
            }
            // Fallback to the default simple button
            return (
              <button
                key={index}
                onClick={() => {
                  onChange(option[valueKey]);
                  closeDropdown();
                }}
                className={`w-full px-3 py-2 text-left text-sm text-white hover:bg-orange-500/10 transition-colors ${
                  isSelected ? 'bg-orange-500/10' : ''
                }`}
              >
                {option[labelKey]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
