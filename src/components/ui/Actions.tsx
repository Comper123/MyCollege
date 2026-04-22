import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, X } from "lucide-react";

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface ContextMenuProps {
  items: ContextMenuItem[];
}

export default function ContextMenu({ items }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const variantCls = {
    default: "text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white",
    danger:  "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600",
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-all"
      >
        {isOpen ? <X size={16} /> : <MoreHorizontal size={16} />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-[#1a1927] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-50 overflow-hidden py-1">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.onClick(); setIsOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${variantCls[item.variant ?? "default"]}`}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}