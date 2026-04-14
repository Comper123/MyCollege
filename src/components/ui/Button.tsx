type ButtonVariantType = 'primary' | 'danger' | 'cancel';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariantType;
  onClick?: () => void;
  className?: string;
}

const buttonClasses: Record<ButtonVariantType, string> = {
  primary: "bg-[#603EF9] text-white",
  danger: "",
  cancel: ""
}

export default function Button({ children, onClick, className = '', variant = 'primary'} : ButtonProps){
  return (
    <button onClick={onClick} className={`py-1.5 px-5 text-sm flex gap-1 items-center rounded-lg ${buttonClasses[variant]} ${className}`}>
      {children}
    </button>
  )
}