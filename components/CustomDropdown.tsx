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
  // Search functionality
  searchable?: boolean;
  searchPlaceholder?: string;
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
  searchable = false,
  searchPlaceholder = "Search...",
}: CustomDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedOption = options.find(opt => opt[valueKey] === value);

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter(option => 
        String(option[labelKey]).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, searchable]);

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
        // UPDATED: Changed background, border, and border-radius
        className={`w-full px-3 py-2 bg-[#111827] border border-gray-700 rounded-[15px] text-white text-sm text-left flex items-center justify-between transition-colors ${
          disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-orange-500 focus:border-orange-500 focus:outline-none'
        }`}
        disabled={disabled}
      >
        <span className="truncate">{selectedOption ? selectedOption[labelKey] : placeholder}</span>
        <svg className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        // UPDATED: Changed background, border, border-radius, and added flex structure
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#111827] border border-gray-700 rounded-[15px] shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
          {searchable && (
            <div className="p-3 border-b border-gray-700">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 pl-8 bg-gray-800 border border-gray-700 rounded-[15px] text-white text-sm placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
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
              })
            ) : (
              <div className="px-3 py-2 text-sm text-gray-400 text-center">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;