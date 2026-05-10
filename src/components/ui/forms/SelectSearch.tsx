'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';

export type Option = {
  label: string;
  value: string;
};

interface SelectSearchProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function SelectSearch({
  options,
  value,
  onChange,
  placeholder = 'Выберите...',
  className = '',
  disabled = false,
}: SelectSearchProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.value === value);
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Обработчик выбора
  const handleSelect = (optValue: string) => {
    onChange?.(optValue);
    setOpen(false);
    setSearch('');
  };

  // Обработчик очистки
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Кнопка-триггер */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 px-4 py-2.5
          text-sm text-left text-gray-900 dark:text-white
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          rounded-xl transition-all duration-200
          ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' : 'hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer'}
          ${open ? 'border-indigo-500 ring-2 ring-indigo-500/20' : ''}
        `}
      >
        <div className="flex-1 truncate">
          {selected ? (
            <span className="font-medium">{selected.label}</span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {selected && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={14} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 text-gray-400 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Выпадающий список */}
      {open && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Поле поиска */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Список опций */}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    w-full text-left px-4 py-2.5 text-sm transition-colors duration-150
                    ${value === opt.value
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Ничего не найдено
              </div>
            )}
          </div>

          {/* Информация о количестве */}
          {options.length > 0 && (
            <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              Всего: {filteredOptions.length} из {options.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}