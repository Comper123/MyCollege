"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Типы ────────────────────────────────────────────────────────────────────

export type PermRole = "lab" | "teacher";

export interface RolePermissions {
  equipmentCreate:  boolean;
  equipmentEdit:    boolean;
  equipmentMove:    boolean;
  equipmentDelete:  boolean;
  maintenanceCreate: boolean;
  repairCreate:     boolean;
  repairConfirm:    boolean;
  roomsManage:      boolean;
  reportsView:      boolean;
  exportData:       boolean;
  usersManage:      boolean;
}

export type PermKey = keyof RolePermissions;

export interface RolePermissionsState {
  lab:     RolePermissions;
  teacher: RolePermissions;
}

// ─── Конфигурация прав ───────────────────────────────────────────────────────

interface PermDef {
  key:         PermKey;
  label:       string;
  description: string;
  group:       string;
  adminOnly?:  boolean; // если true — нельзя снять с других ролей
  lockFor?:    PermRole[]; // заблокировать для конкретных ролей
}

const GROUPS = [
  { key: "equipment",    label: "Оборудование",       icon: "" },
  { key: "maintenance",  label: "Обслуживание",        icon: "" },
  { key: "rooms",        label: "Кабинеты",            icon: "" },
  { key: "reports",      label: "Отчёты и аналитика",  icon: "" },
  { key: "users",        label: "Пользователи",        icon: "" },
] as const;

const PERMISSIONS: PermDef[] = [
  {
    key: "equipmentCreate",  group: "equipment",
    label: "Добавлять оборудование",
    description: "Создание новых записей в базе",
  },
  {
    key: "equipmentEdit",    group: "equipment",
    label: "Редактировать оборудование",
    description: "Изменение характеристик и состояния",
  },
  {
    key: "equipmentMove",    group: "equipment",
    label: "Перемещать оборудование",
    description: "Между кабинетами и подразделениями",
  },
  {
    key: "equipmentDelete",  group: "equipment",
    label: "Списывать оборудование",
    description: "Вывод из эксплуатации и удаление",
  },
  {
    key: "maintenanceCreate", group: "maintenance",
    label: "Отмечать ТО и ремонт",
    description: "Фиксация выполненных работ",
  },
  {
    key: "repairCreate",     group: "maintenance",
    label: "Создавать заявки на ремонт",
    description: "Отправка запросов на обслуживание",
  },
  {
    key: "repairConfirm",    group: "maintenance",
    label: "Подтверждать выполнение работ",
    description: "Закрытие заявок на ремонт",
  },
  {
    key: "roomsManage",      group: "rooms",
    label: "Управлять кабинетами",
    description: "Создание и редактирование кабинетов",
  },
  {
    key: "reportsView",      group: "reports",
    label: "Просматривать отчёты",
    description: "Доступ к сводной аналитике",
  },
  {
    key: "exportData",       group: "reports",
    label: "Экспортировать данные",
    description: "Выгрузка отчётов в CSV / Excel",
  },
  {
    key: "usersManage",      group: "users",
    label: "Управлять пользователями",
    description: "Регистрация, активация, назначение ролей",
    lockFor: ["lab", "teacher"],
  },
];

const DEFAULT_PERMISSIONS: RolePermissionsState = {
  lab: {
    equipmentCreate:   false,
    equipmentEdit:     true,
    equipmentMove:     true,
    equipmentDelete:   false,
    maintenanceCreate: true,
    repairCreate:      true,
    repairConfirm:     false,
    roomsManage:       false,
    reportsView:       false,
    exportData:        false,
    usersManage:       false,
  },
  teacher: {
    equipmentCreate:   false,
    equipmentEdit:     false,
    equipmentMove:     false,
    equipmentDelete:   false,
    maintenanceCreate: false,
    repairCreate:      true,
    repairConfirm:     true,
    roomsManage:       false,
    reportsView:       true,
    exportData:        false,
    usersManage:       false,
  },
};

// ─── Вспомогательные компоненты ──────────────────────────────────────────────

function Toggle({
  checked,
  disabled,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full",
        "transition-colors duration-200 focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#603EF9]/40",
        disabled
          ? "opacity-40 cursor-not-allowed"
          : "cursor-pointer",
        checked
          ? "bg-[#1D9E75]"
          : "bg-gray-200 dark:bg-white/20",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow",
          "transition-transform duration-200",
          checked ? "translate-x-[18px]" : "translate-x-[3px]",
        ].join(" ")}
      />
    </button>
  );
}

function LockBadge() {
  return (
    <div
      title="Только администратор"
      className="flex h-5 w-9 items-center justify-center"
    >
      <svg
        width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="#7F77DD" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </div>
  );
}

// ─── Главный компонент ───────────────────────────────────────────────────────

interface RolePermissionsPanelProps {
  /** Начальные значения (например, загруженные с сервера) */
  initialPermissions?: RolePermissionsState;
  /** Колбэк при сохранении — получает актуальное состояние */
  onSave?: (perms: RolePermissionsState) => Promise<void>;
  /** Показывать ли кнопку "Сбросить к дефолтам" */
  showReset?: boolean;
}

export default function RolePermissionsPanel({
  initialPermissions = DEFAULT_PERMISSIONS,
  onSave,
  showReset = true,
}: RolePermissionsPanelProps) {
  const [perms, setPerms]       = useState<RolePermissionsState>(initialPermissions);
  const [search, setSearch]     = useState("");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [dirty, setDirty]       = useState(false);

  // Считаем изменения относительно начального состояния
  useEffect(() => {
    const changed = (["lab", "teacher"] as PermRole[]).some((role) =>
      PERMISSIONS.some(
        (p) => perms[role][p.key] !== initialPermissions[role][p.key]
      )
    );
    setDirty(changed);
  }, [perms, initialPermissions]);

  const toggle = useCallback(
    (role: PermRole, key: PermKey) => {
      setPerms((prev) => ({
        ...prev,
        [role]: { ...prev[role], [key]: !prev[role][key] },
      }));
      setSaved(false);
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      if (onSave) {
        await onSave(perms);
      } else {
        // Дефолтный вызов API
        await Promise.all(
          (["lab", "teacher"] as PermRole[]).map((role) =>
            fetch(`/api/admin/permissions/role/${role}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(perms[role]),
            })
          )
        );
      }
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save permissions:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPerms(DEFAULT_PERMISSIONS);
    setSaved(false);
  };

  const filteredPerms = PERMISSIONS.filter(
    (p) =>
      search.trim() === "" ||
      p.label.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  const visibleGroups = GROUPS.filter((g) =>
    filteredPerms.some((p) => p.group === g.key)
  );

  return (
    <div className="w-full font-[var(--font-golos,sans-serif)]">
      {/* Шапка */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-white/40">
            Матрица прав доступа
          </span>
          {dirty && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Есть изменения
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showReset && (
            <button
              onClick={handleReset}
              className="rounded-lg border border-gray-200 bg-transparent px-3 py-1.5 text-xs
                         text-gray-600 transition hover:bg-gray-50 dark:border-white/10
                         dark:text-white/50 dark:hover:bg-white/5"
            >
              Сбросить
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className={[
              "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition",
              saved
                ? "border border-[#1D9E75]/40 bg-transparent text-[#1D9E75]"
                : dirty
                ? "bg-[#603EF9] text-white hover:bg-[#4A2ED6] disabled:opacity-60"
                : "border border-gray-200 bg-transparent text-gray-400 dark:border-white/10",
            ].join(" ")}
          >
            {saving
              ? "Сохранение..."
              : saved
              ? "✓ Сохранено"
              : "Сохранить"}
          </button>
        </div>
      </div>

      {/* Поиск */}
      <div className="relative mb-4">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30"
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск прав..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-3
                     text-sm text-gray-800 placeholder-gray-400 focus:border-[#603EF9]/50
                     focus:outline-none focus:ring-1 focus:ring-[#603EF9]/20
                     dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-white/30"
        />
      </div>

      {/* Матрица */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10">
        {/* Заголовок колонок */}
        <div className="grid grid-cols-[1fr_130px_130px_130px] border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5">
          <div className="px-4 py-3 text-xs text-gray-500 dark:text-white/40">
            Действие / Право
          </div>
          {[
            { role: "admin",   label: "Администратор", sub: "Полный доступ", color: "text-[#3C3489] dark:text-[#b5a8ff]" },
            { role: "lab",     label: "Лаборант",       sub: "Учёт и ТО",    color: "text-[#085041] dark:text-[#6de0b8]" },
            { role: "teacher", label: "Преподаватель",  sub: "Контроль",     color: "text-[#633806] dark:text-[#ffc15e]" },
          ].map((col) => (
            <div key={col.role} className="flex flex-col items-center gap-0.5 border-l border-gray-200 px-2 py-3 dark:border-white/10">
              <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
              <span className="text-[11px] text-gray-400 dark:text-white/30">{col.sub}</span>
            </div>
          ))}
        </div>

        {/* Группы и строки */}
        {visibleGroups.map((group) => {
          const groupPerms = filteredPerms.filter((p) => p.group === group.key);
          return (
            <div key={group.key}>
              {/* Заголовок группы */}
              <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-200/50 px-4 py-2 dark:border-white/5 dark:bg-white/3">
                {/* <span className="text-sm">{group.icon}</span> */}
                <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30">
                  {group.label}
                </span>
              </div>

              {/* Строки прав */}
              {groupPerms.map((perm) => (
                <div
                  key={perm.key}
                  className="grid grid-cols-[1fr_130px_130px_130px] border-t border-gray-100 transition-colors hover:bg-gray-50/70 dark:border-white/5 dark:hover:bg-white/3"
                >
                  {/* Название */}
                  <div className="px-4 py-3">
                    <p className="text-sm text-gray-800 dark:text-white/85">{perm.label}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-white/35">{perm.description}</p>
                  </div>

                  {/* Администратор — всегда заблокирован */}
                  <div className="flex items-center justify-center border-l border-gray-100 dark:border-white/5">
                    <LockBadge />
                  </div>

                  {/* Лаборант */}
                  <div className="flex items-center justify-center border-l border-gray-100 dark:border-white/5">
                    {perm.lockFor?.includes("lab") ? (
                      <div className="opacity-30"><LockBadge /></div>
                    ) : (
                      <Toggle
                        checked={perms.lab[perm.key]}
                        onChange={() => toggle("lab", perm.key)}
                        ariaLabel={`Лаборант — ${perm.label}`}
                      />
                    )}
                  </div>

                  {/* Преподаватель */}
                  <div className="flex items-center justify-center border-l border-gray-100 dark:border-white/5">
                    {perm.lockFor?.includes("teacher") ? (
                      <div className="opacity-30"><LockBadge /></div>
                    ) : (
                      <Toggle
                        checked={perms.teacher[perm.key]}
                        onChange={() => toggle("teacher", perm.key)}
                        ariaLabel={`Преподаватель — ${perm.label}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {visibleGroups.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-gray-400 dark:text-white/30">
            Ничего не найдено
          </div>
        )}
      </div>

      {/* Легенда */}
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {[
          { color: "bg-[#1D9E75]", label: "Право включено" },
          { color: "bg-gray-300 dark:bg-white/20", label: "Право выключено" },
          { color: "bg-[#7F77DD]", label: "Только администратор" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${item.color}`} />
            <span className="text-[11px] text-gray-400 dark:text-white/35">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}