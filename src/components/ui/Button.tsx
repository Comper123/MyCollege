type ButtonVariantType = 'primary' | 'danger' | 'secondary' | 'success';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariantType;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  size?: 'sm' | 'md' | 'lg';
}

const buttonClasses: Record<ButtonVariantType, string> = {
  primary: "bg-[#603EF9] hover:bg-[#4A2ED6] active:bg-[#3B22B0] text-white shadow-sm",
  danger: "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-sm",
  secondary: "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200",
  success: "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-sm"
};

const sizeClasses = {
  sm: "py-1 px-3 text-xs gap-1 rounded-md",
  md: "py-1.5 px-5 text-sm gap-1.5 rounded-lg",
  lg: "py-2 px-6 text-base gap-2 rounded-xl"
};

export default function Button({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary',
  disabled = false,
  loading = false,
  type = 'button',
  size = 'md'
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${sizeClasses[size]}
        ${buttonClasses[variant]}
        flex items-center justify-center
        font-medium
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#603EF9]
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
        ${className}
      `}
    >
      {loading && (
        <svg 
          className="animate-spin h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}