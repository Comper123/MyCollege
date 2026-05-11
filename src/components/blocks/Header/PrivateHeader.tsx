"use client";

import { useAuth } from "@/context/AuthContext";
import { fio } from "@/lib/db/schema";
import { ChevronDown, LogOut, Settings, User, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function PrivateHeader() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:px-8 bg-white/80 dark:bg-[#0c0b18]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
      {/* Логотип */}
      <div className="flex items-center gap-2.5 font-unbounded text-base md:text-lg font-bold">
        <div className="w-8 h-8 bg-[#603EF9] rounded-lg flex items-center justify-center text-sm font-bold text-white">
          М
        </div>
        <span className="text-gray-900 dark:text-white hidden sm:inline">Мой ПТК</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Кнопка уведомлений */}
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors relative">
          <Bell size={18} className="text-gray-600 dark:text-gray-400" />
        </button>

        {/* Профиль */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 md:gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#603EF9] to-[#4A2ED6] flex items-center justify-center text-white font-medium text-sm">
              {user.firstname?.[0]}{user.lastname?.[0]}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {fio(user)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user.role === "admin" ? "Администратор" : user.role === "laborant" ? "Лаборант" : "Преподаватель"}
              </p>
            </div>
            <ChevronDown 
              size={16} 
              className={`text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Выпадающее меню */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1a2e] rounded-xl shadow-lg border border-gray-200 dark:border-white/10 overflow-hidden z-50">
              <div className="p-3 border-b border-gray-100 dark:border-white/10">
                <p className="font-medium text-gray-900 dark:text-white">{fio(user)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
              </div>
              
              <div className="p-1">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Settings size={16} />
                  Настройки
                </Link>
                
                <Link
                  href="/dashboard/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <User size={16} />
                  Профиль
                </Link>
                
                <hr className="my-1 border-gray-100 dark:border-white/10" />
                
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  Выйти
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}