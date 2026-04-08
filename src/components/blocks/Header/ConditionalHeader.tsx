"use client";

import PublicHeader from "./PublicHeader";
import PrivateHeader from "./PrivateHeader";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

export default function ConditionalHeader() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [lastKnownAuth, setLastKnownAuth] = useState<boolean | null>(null);

  useEffect(() => {
    // Обновляем только когда загрузка завершена
    if (!isLoading) {
      setLastKnownAuth(isAuthenticated);
    }
  }, [isAuthenticated, isLoading]);

  // Пока не знаем состояние — показываем последнее известное или заглушку
  const showPrivate = lastKnownAuth === true || (!isLoading && isAuthenticated);
  const showPublic = lastKnownAuth === false || (!isLoading && !isAuthenticated);

  if (!showPrivate && !showPublic) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-5 py-4 md:px-10 bg-white/80 dark:bg-[#0c0b18]/60 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2.5 font-unbounded text-base md:text-lg font-bold">
          <div className="w-8 h-8 bg-[#603EF9] rounded-lg flex items-center justify-center text-sm font-bold text-white">М</div>
          Мой ПТК
        </div>
        <div className="w-8 h-8" />
      </nav>
    );
  }

  return showPrivate ? <PrivateHeader /> : <PublicHeader />;
}