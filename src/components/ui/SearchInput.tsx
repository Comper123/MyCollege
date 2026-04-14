import { X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  className?: string;
  placeholder?: string;
}

export default function SearchInput({ value, onChange, onClear, className = '', placeholder = 'Поиск...' }: SearchInputProps){
  return (
    <div className={`relative ${className}`}>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-full rounded-lg text-sm pl-3 border focus:outline-none "/>
      {value && (
        <button onClick={onClear} className="absolute top-1/2 translate-y-[-50%] right-1.5"><X size={18}/></button>
      )}
    </div>
  )
}