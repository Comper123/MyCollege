"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PublicHeader() {
  const pathname = usePathname();
  
  // Не показываем хедер на странице логина/регистрации
  if (pathname === "/auth/login" || pathname === "/auth/register") {
    return null;
  }

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:px-8 bg-white/80 dark:bg-[#0c0b18]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
      {/* Логотип */}
      <div className="flex items-center gap-2.5 font-unbounded text-base md:text-lg font-bold">
        <div className="w-8 h-8 bg-[#603EF9] rounded-lg flex items-center justify-center text-sm font-bold text-white">
          М
        </div>
        <span className="text-gray-900 dark:text-white">Мой ПТК</span>
      </div>
      
      <div className="flex items-center gap-3">
        <Link
          href="/auth/login"
          className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Войти
        </Link>
        <Link
          href="/auth/register"
          className="px-4 py-1.5 text-sm font-medium bg-[#603EF9] text-white rounded-lg hover:bg-[#4A2ED6] transition-colors"
        >
          Регистрация
        </Link>
      </div>
    </nav>
  );
}