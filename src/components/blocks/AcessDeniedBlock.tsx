import { AlertTriangle } from "lucide-react"

export default function AccessDeniedBlock({ message = "Недостаточно прав для данного действия" } : { 
  message?: string
}){
  return (
    <div className="w-full h-full flex items-center flex-col items justify-center">
      <div className="bg-red-100 text-red-600 rounded-lg flex items-center justify-center w-16 h-16">
        <AlertTriangle />
      </div>
      <p className="mt-3 mb-6 text-lg text-red-600 font-semibold">Ошибка доступа</p>
      <p className="text-gray-600">{message}</p>
      <p className="mt-1 text-gray-400 text-sm">Обратитесь за помощью к администратору</p>
    </div>
  )
}