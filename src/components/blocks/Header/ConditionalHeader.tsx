"use client";

import PublicHeader from "./PublicHeader";
import PrivateHeader from "./PrivateHeader";
import { useAuth } from "@/context/AuthContext";

export default function ConditionalHeader() {
  const { isAuthenticated, isLoading } = useAuth();

  // Показываем заглушку во время загрузки
  if (isLoading) {
    return (
      <nav className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:px-8 bg-white/80 dark:bg-[#0c0b18]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2.5 font-unbounded text-base md:text-lg font-bold">
          <div className="w-8 h-8 bg-[#603EF9] rounded-lg flex items-center justify-center text-sm font-bold text-white">М</div>
          <span className="text-gray-900 dark:text-white">Мой ПТК</span>
        </div>
        <div className="w-8 h-8 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full" />
      </nav>
    );
  }

  return isAuthenticated ? <PrivateHeader /> : <PublicHeader />;
}