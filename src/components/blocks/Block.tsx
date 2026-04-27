type BlockSize = 'sm' | 'xs' | 'lg' | 'xl';

interface BlockProps {
  children: React.ReactNode;
  size?: BlockSize;
}

export function Block({children, size = 'xl'}: BlockProps){
  const sizeClass: Record<BlockSize, string> = {
    sm: "p-4 shadow",
    xs: "p-6 shadow",
    lg: "p-8 shadow-sm",
    xl: "p-10 shadow-md"
  }
  
  return (
    <div className={`bg-white border border-gray-200 dark:border-white/10 dark:bg-zinc-950 rounded-xl ${sizeClass[size]} m-6`}>
      {children}
    </div>
  )
}