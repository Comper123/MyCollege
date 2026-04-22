export default function EmptyBlock({ title = 'Здесь пока ничего нет' } : { title?: string}){
  return (
    <div className="w-full min-h-[50vh] flex items-center justify-center">
     <p className="text-gray-400">{title}</p>
    </div>
  )
}