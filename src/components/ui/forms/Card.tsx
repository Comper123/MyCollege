interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export default function Card({ className = '', children } : CardProps){
  return (
    <div className={`${className} p-4 border rounded-lg`}>
      {children}
    </div>
  )
}