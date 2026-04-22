import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ModalProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const modalClasses = {
  sm: 'w-1/4 max-w-sm', 
  md: 'w-1/3 max-w-md', 
  lg: 'w-1/2 max-w-lg', 
  xl: 'w-8/12 max-w-6xl',
  full: 'w-11/12 max-w-[95vw] max-h-[95vh]'
}

export default function Modal({ size = 'md', children, isOpen, onClose, title} : ModalProps){
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const mouseDownTarget = useRef<EventTarget | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Блокируем скролл body
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handler = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') onClose(); 
    };
    window.addEventListener('keydown', handler);
    
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handler);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Закрываем только если и mousedown и click были на backdrop
    if (e.target === backdropRef.current && mouseDownTarget.current === backdropRef.current) {
      onClose();
    }
  };

  return (
    <div 
      ref={backdropRef}
      className="top-0 left-0 flex items-center justify-center w-screen h-screen absolute bg-black/70 z-50"
      onMouseDown={e => { mouseDownTarget.current = e.target; }}
      onClick={handleBackdropClick}>
      <div
        ref={modalRef} 
        className={`p-8 pt-0 bg-white dark:bg-[#1a1927] relative rounded-xl ${modalClasses[size]} max-h-[95vh] overflow-y-auto scrollbar-thin`}>
        <div className="flex justify-between top-0 py-6 bg-white dark:bg-[#1a1927] sticky items-center mb-3 pb-2 border-b border-gray-100 dark:border-white/10">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h2>
          <div className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer rounded-md text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors" onClick={onClose}>
            <X size={20}/>
          </div>
        </div>
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  )
}

interface ModalFieldProps {
  title?: string;
  children: React.ReactNode;
  action?: () => void;
  actionText?: string;
}

export function ModalField({ title, children, action, actionText } : ModalFieldProps){
  return (
    <div>
      <div className="flex justify-between">
        <p className="text-gray-500 font-medium text-sm">{title}</p>
        {action && (
          <p onClick={action} className="text-indigo-600 text-sm cursor-pointer">{actionText}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}

export function ModalGroupField({ title, children } : ModalFieldProps){
  return (
    <div>
      <p className="text-gray-600 font-semibold text-base mb-2">{title}</p>
      <div>{children}</div>
    </div>
  )
}