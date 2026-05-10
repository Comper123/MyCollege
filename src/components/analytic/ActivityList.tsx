"use client";

import { ActivityItem } from "@/types/dashboard";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface ActivityListProps {
  activities: ActivityItem[];
  title?: string;
  isLoading?: boolean;
}

const activityIcons: Record<string, string> = {
  equipment_added: "➕",
  equipment_moved: "📦",
  request_created: "📝",
  request_completed: "✅",
  user_joined: "👤",
};

export default function ActivityList({ activities, title, isLoading = false }: ActivityListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Нет активности</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg">
                {activityIcons[activity.type] || "📌"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                <p className="text-xs text-gray-500">{activity.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{activity.user}</span>
                  <span className="text-xs text-gray-300">•</span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: ru })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}