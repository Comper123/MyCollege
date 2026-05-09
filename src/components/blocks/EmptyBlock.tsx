import { ReactNode } from "react";
import { FolderOpen } from "lucide-react";

interface EmptyBlockProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyBlock({ 
  title = "Здесь пока ничего нет", 
  description, 
  icon, 
  action 
}: EmptyBlockProps) {
  return (
    <div className="w-full min-h-[50vh] flex flex-col items-center justify-center text-center">
      {icon ? icon : <FolderOpen size={48} className="text-gray-300 dark:text-gray-600 mb-3" />}
      <p className="text-gray-500 dark:text-gray-400 text-base font-medium mb-1">
        {title}
      </p>
      {description && (
        <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}