'use client';

import { useState } from 'react';

export type Option = {
  label: string;
  value: string;
};

interface SelectSearchProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export default function SelectSearch({
  options,
  value,
  onChange,
  placeholder = 'Выберите...',
}: SelectSearchProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selected = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full max-w-sm">
      {/* Trigger */}
      <div
        onClick={() => setOpen((prev) => !prev)}
        className="border rounded px-3 py-2 cursor-pointer bg-white"
      >
        {selected ? selected.label : placeholder}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-10 w-full border rounded mt-1 bg-white shadow">
          {/* Search */}
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-2 py-1 border-b outline-none"
          />

          {/* Options */}
          <div className="max-h-40 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange?.(opt.value);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500">
                Ничего не найдено
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}