interface GridProps {
  cols: number;
  children: React.ReactNode;
}

export default function Grid({ cols, children } : GridProps){
  const columnClass = [
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4',
    'grid-cols-5', 'grid-cols-6', 'grid-cols-7', 'grid-cols-8',
    'grid-cols-9', 'grid-cols-10', 'grid-cols-11', 'grid-cols-12'
  ];

  return (
    <div className={`grid ${columnClass[cols - 1]} gap-4`}>
      {children}
    </div>
  )
}