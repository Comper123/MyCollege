"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ChevronDown, ChevronRight, LibraryBig, UserStar } from "lucide-react"
import { User, UserRole } from "@/lib/db/schema";
import { SelectUser } from "@/lib/auth/types";


const ICON_ONLY_THRESHOLD = 80;
const DEFAULT_WIDTH = 224;
const MIN_WIDTH = 48;
const MAX_WIDTH = 280;

interface NavItemType {
  href: string;
  exact?: boolean;
  label?: string;
  icon?: React.ReactNode;
  accessRoles?: UserRole[];
  subNavs?: NavItemType[]
}

const navItems: NavItemType[] = [
  {
    href: "/dashboard",
    exact: true,
    label: "Панель",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/dashboard/equipment",
    label: "Оборудование",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    href: "/dashboard/rooms",
    label: "Кабинеты",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/dashboard/requests",
    label: "Заявки",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="13" y2="17" />
      </svg>
    ),
  },
  {
    href: "/dashboard/reports",
    label: "Отчёты",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    href: "/dashboard/admin",
    label: "Админ-панель",
    accessRoles: ["admin"],
    icon: (
      <UserStar strokeWidth={1} size={18}/>
    ),
    subNavs: [
      {
        href: "/dashboard/admin/users",
        label: "Пользователи",
        accessRoles: ["admin"],
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        href: "/dashboard/admin/equipmentTypes",
        label: "Типы оборудования",
        accessRoles: ["admin"],
        icon: (
          <LibraryBig strokeWidth={1} size={18}/>
        ),
      }
    ]
  }
];

interface NavItemProps {
  item: NavItemType;
  pathname?: string;
  user?: SelectUser;
}

function NavItem({item, user} : NavItemProps){
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(() =>
    item.subNavs?.some(nav => nav.href.startsWith(item.href)) ?? false
  );
  if (item.accessRoles && user?.role && !item.accessRoles.includes(user?.role)) return null;
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  

  return (
    <>  
    {item.subNavs ? (
      <div className="flex flex-col w-full items-center text-sm transition-all overflow-hidden whitespace-nowrap">
        <div onClick={() => setIsOpen(prev => !prev)}
        className="text-gray-600 dark:text-white/60 flex gap-2.5 cursor-pointer h-full w-full hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg hover:text-gray-900 dark:hover:text-white px-4 py-2.5">
          <span className="shrink-0">{item.icon}</span>
          <span>{item.label}</span>
          <div className="h-full flex ml-auto items-center">
            {isOpen ? (
              <ChevronDown strokeWidth={1} size={16}/>
            ) : (
              <ChevronRight strokeWidth={1} size={16}/>
            )}
          </div>
        </div>
        {isOpen && (
          <div className="w-max ml-4 mt-1 flex flex-col gap-1">
            {item.subNavs.map((nav, i) => <NavItem item={nav} key={i}/>)}
          </div>
        )}
      </div>
    ) : (
      <Link
        href={item.href}
        title={item.label}
        className={`flex items-center gap-2.5 rounded-lg text-sm whitespace-nowrap w-full
          ${"px-4 py-2.5"}
          ${isActive
            ? "bg-[#603EF9]/10 text-[#603EF9] dark:bg-[#603EF9]/20 dark:text-[#b5a8ff] font-medium"
            : "text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
          }`}
      >
        <span className="shrink-0">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    )}
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  
  return (
    <div className="flex min-h-[calc(100vh-100px)] bg-gray-50 dark:bg-[#0c0b18]">
      {/* Sidebar */}
      <aside
        className="relative shrink-0 min-w-64 w-max max-w-64 flex flex-col border-r border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0e1c] transition-none"
      >
        <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-hidden">
          {navItems.map((item, i) => (
            <NavItem item={item} key={i} user={user as SelectUser}/>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-gray-200 dark:border-white/10 flex flex-col gap-0.5">
          <Link
            href="/dashboard/settings"
            title={"Настройки"}
            className={`flex items-center gap-2.5 rounded-lg text-sm text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all overflow-hidden whitespace-nowrap
              ${"px-3 py-2"}`}
          >
            <span className="shrink-0">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            { "Настройки"}
          </Link>
          <button
            onClick={logout}
            title={"Выйти"}
            className={`flex items-center gap-2.5 rounded-lg text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all w-full whitespace-nowrap overflow-hidden
              ${"px-3 py-2 text-left"}`}
          >
            <span className="shrink-0">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            {"Выйти"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}