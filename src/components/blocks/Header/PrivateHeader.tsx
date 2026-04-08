// src/components/Header/PrivateHeader.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function PrivateHeader() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, mounted } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!mounted) {
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

  const getRoleColor = () => {
    switch (user?.role) {
      case "admin": return "text-[#603EF9] dark:text-[#b5a8ff]";
      case "laborant": return "text-[#1d9e75] dark:text-[#6de0b8]";
      case "teacher": return "text-[#ba7517] dark:text-[#ffc15e]";
      default: return "";
    }
  };

  const getRoleName = () => {
    switch (user?.role) {
      case "admin": return "Администратор";
      case "laborant": return "Лаборант";
      case "teacher": return "Преподаватель";
      default: return "";
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-5 py-4 md:px-10 bg-white/80 dark:bg-[#0c0b18]/60 backdrop-blur-md border-b border-gray-200 dark:border-white/10 transition-colors">
      <Link href="/dashboard" className="flex items-center gap-2.5 font-unbounded text-base md:text-lg font-bold text-gray-900 dark:text-white no-underline hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 bg-[#603EF9] rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0">М</div>
        Мой ПТК
      </Link>

      <div className="hidden md:flex items-center gap-6">
      </div>

      <div className="flex items-center gap-4">
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

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#603EF9] to-[#4A2ED6] flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</div>
              <div className={`text-xs ${getRoleColor()}`}>{getRoleName()}</div>
            </div>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-500">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1a2e] rounded-xl shadow-lg border border-gray-200 dark:border-white/10 overflow-hidden z-20">
                <div className="py-1">
                  <Link href="/profile" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                    Профиль
                  </Link>
                  <Link href="/settings" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                    Настройки
                  </Link>
                  <hr className="my-1 border-gray-200 dark:border-white/10" />
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                    Выйти
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}