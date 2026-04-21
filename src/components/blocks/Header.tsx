// src/components/Header.tsx
"use client";

import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

export default function Header() {
  const { isDark, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <nav className="top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-4 md:px-10 bg-white/80 dark:bg-[#0c0b18]/60 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2.5 font-unbounded text-base md:text-lg font-bold text-gray-900 dark:text-white">
          <div className="w-8 h-8 bg-[#603EF9] rounded-lg flex items-center justify-center text-sm font-bold text-white">М</div>
          Мой ПТК
        </div>
        <div className="w-8 h-8" />
      </nav>
    );
  }

  return (
    <nav className="top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-4 md:px-10 bg-white/80 dark:bg-[#0c0b18]/60 backdrop-blur-md border-b border-gray-200 dark:border-white/10 transition-colors">
      <Link href="/" className="flex items-center gap-2.5 font-unbounded text-base md:text-lg font-bold text-gray-900 dark:text-white no-underline hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 bg-[#603EF9] rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0">
          М
        </div>
        Мой ПТК
      </Link>

      <div className="flex items-center gap-4">
        {/* Кнопка переключения темы */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
          aria-label="Переключить тему"
        >
          {isDark ? (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-yellow-400">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-700 dark:text-gray-400">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Навигационные ссылки - можно передавать через children или пропсы */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm text-gray-600 dark:text-white/65 hover:text-gray-900 dark:hover:text-white transition-colors">
            Возможности
          </Link>
          <Link href="#how" className="text-sm text-gray-600 dark:text-white/65 hover:text-gray-900 dark:hover:text-white transition-colors">
            Как работает
          </Link>
          <Link href="#roles" className="text-sm text-gray-600 dark:text-white/65 hover:text-gray-900 dark:hover:text-white transition-colors">
            Роли
          </Link>
        </div>

        <Link
          href="/login"
          className="bg-[#603EF9] hover:bg-[#4A2ED6] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all no-underline"
        >
          Войти
        </Link>
      </div>
    </nav>
  );
}