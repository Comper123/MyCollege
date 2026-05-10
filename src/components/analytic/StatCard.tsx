"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "indigo" | "emerald" | "amber" | "red" | "blue" | "purple";
  description?: string;
  isLoading?: boolean;
}

const colorStyles = {
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/30",
    iconBg: "bg-red-100 dark:bg-red-900/50",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
  },
};

export default function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  color = "indigo", 
  description,
  isLoading = false 
}: StatCardProps) {
  const styles = colorStyles[color];

  if (isLoading) {
    return (
      <div className={`rounded-xl border ${styles.border} bg-white dark:bg-gray-800/30 p-5 animate-pulse`}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${styles.border} bg-white dark:bg-gray-800/30 p-5 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {trend && (
              <div className={`flex items-center gap-0.5 text-xs font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {trend.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center ${styles.text}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}