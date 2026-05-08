export default function EmptyBlock({ title = 'Здесь пока ничего нет', icon } : { title?: string, icon?: React.ReactNode}){
  return (
    <div className="w-full min-h-[50vh] flex items-center justify-center flex-col">
      {icon && icon}
     <p className="text-gray-400">{title}</p>
    </div>
  )
}