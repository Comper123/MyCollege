"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  ChevronDown, 
  ChevronRight, 
  DoorOpen, 
  LibraryBig, 
  MailQuestionMark, 
  Monitor, 
  Shield, 
  UserStar,
  Settings,
  LogOut,
  Home,
  BarChart3,
  Menu,
  X,
  Scan,
  Package
} from "lucide-react";
import { UserRole } from "@/lib/db/schema";
import { SelectUser } from "@/lib/auth/types";

interface NavItemType {
  href: string;
  exact?: boolean;
  label?: string;
  icon?: React.ReactNode;
  accessRoles?: UserRole[];
  subNavs?: NavItemType[];
  query?: string;
}

const navItems: NavItemType[] = [
  {
    href: "/dashboard",
    exact: true,
    label: "Главная",
    icon: <Home strokeWidth={1.5} size={18} />,
  },
  {
    href: "/dashboard/equipment",
    label: "Оборудование",
    accessRoles: ["laborant", "admin"],
    icon: <Monitor strokeWidth={1.5} size={18} />,
  },
  {
    href: "/dashboard/my-equipment",
    label: "Моё оборудование",
    accessRoles: ["teacher"],
    icon: <Package strokeWidth={1.5} size={18} />,
  },
  {
    href: "/dashboard/rooms",
    label: "Кабинеты",
    accessRoles: ["admin", "laborant"],
    icon: <DoorOpen strokeWidth={1.5} size={18} />,
  },
  {
    href: "/dashboard/rooms",
    label: "Мои кабинеты",
    accessRoles: ["teacher"],
    icon: <DoorOpen strokeWidth={1.5} size={18} />,
    query: "?isMy=true",
  },
  {
    href: "/dashboard/requests",
    label: "Заявки",
    accessRoles: ["laborant", "admin"],
    icon: <MailQuestionMark strokeWidth={1.5} size={18} />,
  },
  {
    href: "/dashboard/requests",
    label: "Мои заявки",
    accessRoles: ["teacher"],
    icon: <MailQuestionMark strokeWidth={1.5} size={18} />,
  },
  {
    href: "/dashboard/reports",
    label: "Отчёты",
    icon: <BarChart3 strokeWidth={1.5} size={18} />,
  },
  {
    href: "/dashboard/admin",
    label: "Админ-панель",
    accessRoles: ["admin"],
    icon: <UserStar strokeWidth={1.5} size={18} />,
    subNavs: [
      {
        href: "/dashboard/admin/users",
        label: "Пользователи",
        accessRoles: ["admin"],
        icon: <UserStar strokeWidth={1.5} size={18} />,
      },
      {
        href: "/dashboard/admin/equipmentTypes",
        label: "Типы оборудования",
        accessRoles: ["admin"],
        icon: <LibraryBig strokeWidth={1.5} size={18} />,
      },
      {
        href: "/dashboard/admin/permissions",
        label: "Права пользователей",
        accessRoles: ["admin"],
        icon: <Shield strokeWidth={1.5} size={18} />,
      },
    ],
  },
  {
    href: "/dashboard/scan",
    label: "Сканировать QR",
    icon: <Scan strokeWidth={1.5} size={18} />,
    accessRoles: ["admin", "laborant", "teacher"],
  },
];

interface NavItemProps {
  item: NavItemType;
  user?: SelectUser;
  onNavigate?: () => void;
}

function NavItem({ item, user, onNavigate }: NavItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Вычисляем, имеет ли пользователь доступ
  const hasAccess = !item.accessRoles || (user?.role && item.accessRoles.includes(user.role));
  
  // Формируем полный путь с query параметрами
  const fullHref = item.query ? `${item.href}${item.query}` : item.href;
  
  // Проверка активности
  const isActive = item.exact 
    ? pathname === item.href
    : pathname.startsWith(item.href);

  // Проверка активности для раскрытия подменю
  const hasActiveSub = item.subNavs?.some(sub => 
    pathname.startsWith(sub.href)
  );

  

  useEffect(() => {
    const setActive = (hasActiveSub: boolean | undefined) => {
      if (hasActiveSub) {
        setIsOpen(true);
      }
    }
    setActive(hasActiveSub)
  }, [hasActiveSub]);

  const handleClick = () => {
    if (item.subNavs) {
      setIsOpen(!isOpen);
    } else {
      router.push(fullHref);
      onNavigate?.();
    }
  };

  // Если нет доступа - не показываем пункт меню
  if (!hasAccess) {
    return null;
  }

  // Рендер подменю
  if (item.subNavs) {
    return (
      <div className="flex flex-col w-full">
        <button
          onClick={handleClick}
          className={`flex items-center gap-2.5 rounded-lg text-sm w-full px-4 py-2.5 transition-all ${
            isActive || hasActiveSub
              ? "bg-[#603EF9]/10 text-[#603EF9] dark:bg-[#603EF9]/20 dark:text-[#b5a8ff] font-medium"
              : "text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <span className="shrink-0">{item.icon}</span>
          <span className="flex-1 text-left">{item.label}</span>
          <span className="shrink-0">
            {isOpen ? (
              <ChevronDown strokeWidth={1.5} size={16} />
            ) : (
              <ChevronRight strokeWidth={1.5} size={16} />
            )}
          </span>
        </button>
        
        {isOpen && (
          <div className="ml-6 mt-1 flex flex-col gap-1 border-l border-gray-200 dark:border-white/10 pl-2">
            {item.subNavs.map((subItem, idx) => (
              <NavItem key={idx} item={subItem} user={user} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={fullHref}
      onClick={onNavigate}
      className={`flex items-center gap-2.5 rounded-lg text-sm w-full px-4 py-2.5 transition-all ${
        isActive
          ? "bg-[#603EF9]/10 text-[#603EF9] dark:bg-[#603EF9]/20 dark:text-[#b5a8ff] font-medium"
          : "text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      <span className="shrink-0">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Проверка на мобильное устройство
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const handleNavigate = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0c0b18] overflow-hidden">
      {/* Мобильный оверлей */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - фиксированная высота 100vh с прокруткой */}
      <aside
        className={`fixed md:relative z-50 shrink-0 w-64 flex flex-col bg-white dark:bg-[#0f0e1c] border-r border-gray-200 dark:border-white/10 transition-all duration-300 ${
          isSidebarOpen ? "left-0" : "-left-64 md:left-0 md:w-20"
        } h-full`}
      >
        {/* Логотип в сайдбаре - фиксированная часть */}
        {isMobile && (
        <div className="shrink-0 p-4 border-b border-gray-200 dark:border-white/10">
          <div className={`flex items-center gap-2.5 font-unbounded font-bold ${!isSidebarOpen && !isMobile ? "justify-center" : ""}`}>
            <div className="w-8 h-8 bg-[#603EF9] rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0">
              М
            </div>
            {(isSidebarOpen || isMobile) && (
              <span className="text-gray-900 dark:text-white text-sm whitespace-nowrap">
                Мой ПТК
              </span>
            )}
          </div>
        </div>
        )}
        {/* Навигация - скроллируемая часть */}
        <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
          {navItems.map((item, i) => (
            <NavItem key={i} item={item} user={user as SelectUser} onNavigate={handleNavigate} />
          ))}
        </nav>

        {/* Нижняя часть сайдбара - фиксированная */}
        <div className="shrink-0 p-2 border-t border-gray-200 dark:border-white/10 flex flex-col gap-1">
          <Link
            href="/dashboard/settings"
            onClick={handleNavigate}
            className={`flex items-center gap-2.5 rounded-lg text-sm w-full px-4 py-2.5 transition-all text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white ${
              !isSidebarOpen && !isMobile ? "justify-center" : ""
            }`}
          >
            <Settings strokeWidth={1.5} size={18} className="shrink-0" />
            {(isSidebarOpen || isMobile) && <span>Настройки</span>}
          </Link>
          
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2.5 rounded-lg text-sm w-full px-4 py-2.5 transition-all text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 ${
              !isSidebarOpen && !isMobile ? "justify-center" : ""
            }`}
          >
            <LogOut strokeWidth={1.5} size={18} className="shrink-0" />
            {(isSidebarOpen || isMobile) && <span>Выйти</span>}
          </button>
        </div>
      </aside>

      {/* Кнопка бургер-меню для мобильных */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed bottom-4 right-4 z-50 md:hidden p-3 bg-[#603EF9] text-white rounded-full shadow-lg"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Основной контент - с прокруткой */}
      <main className="flex-1 overflow-y-auto h-full">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}