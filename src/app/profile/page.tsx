// src/app/profile/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

type FormData = {
  firstname: string;
  lastname: string;
  fathername: string;
  email: string;
};

type PasswordData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: "Администратор", color: "text-[#603EF9] dark:text-[#b5a8ff]", bg: "bg-[#603EF9]/10 dark:bg-[#603EF9]/20 border-[#603EF9]/25" },
  laborant: { label: "Лаборант", color: "text-[#1d9e75] dark:text-[#6de0b8]", bg: "bg-[#1d9e75]/10 dark:bg-[#1d9e75]/20 border-[#1d9e75]/25" },
  teacher: { label: "Преподаватель", color: "text-[#ba7517] dark:text-[#ffc15e]", bg: "bg-[#ba7517]/10 dark:bg-[#ba7517]/20 border-[#ba7517]/25" },
};

export default function ProfilePage() {
  const { user, refetchUser, isLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    firstname: "",
    lastname: "",
    fathername: "",
    email: "",
  });

  const [passwords, setPasswords] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [successInfo, setSuccessInfo] = useState(false);
  const [successPwd, setSuccessPwd] = useState(false);
  const [errorInfo, setErrorInfo] = useState("");
  const [errorPwd, setErrorPwd] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
    if (user) {
      setForm({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        fathername: user.fathername || "",
        email: user.email || "",
      });
    }
  }, [user, isLoading, router]);

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorInfo("");
    setSuccessInfo(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
          fathername: form.fathername.trim(),
        }),
      });

      if (res.ok) {
        setSuccessInfo(true);
        await refetchUser();
        setTimeout(() => setSuccessInfo(false), 3000);
      } else {
        const data = await res.json();
        setErrorInfo(data.error || "Ошибка сохранения");
      }
    } catch {
      setErrorInfo("Ошибка соединения с сервером");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPwd("");
    setSuccessPwd(false);

    if (passwords.newPassword !== passwords.confirmPassword) {
      setErrorPwd("Новые пароли не совпадают");
      return;
    }
    if (passwords.newPassword.length < 6) {
      setErrorPwd("Пароль должен содержать не менее 6 символов");
      return;
    }

    setSavingPwd(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      if (res.ok) {
        setSuccessPwd(true);
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setSuccessPwd(false), 3000);
      } else {
        const data = await res.json();
        setErrorPwd(data.error || "Ошибка смены пароля");
      }
    } catch {
      setErrorPwd("Ошибка соединения с сервером");
    } finally {
      setSavingPwd(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0c0b18]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-[#603EF9]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-400 dark:text-white/40">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const role = roleLabels[user.role] ?? roleLabels.teacher;
  const initials = [user.firstname, user.lastname]
    .filter(Boolean)
    .map((s) => s!.charAt(0).toUpperCase())
    .join("") || user.email.charAt(0).toUpperCase();

  const fullName = [form.firstname, form.fathername, form.lastname].filter(Boolean).join(" ") || user.email;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0c0b18] text-gray-900 dark:text-white">
      {/* Фоновый градиент */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,rgba(96,62,249,0.07)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Шапка профиля */}
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Аватар */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#603EF9] to-[#4A2ED6] flex items-center justify-center text-white text-2xl font-bold font-unbounded select-none shadow-lg">
                {initials}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Изменить фото"
              >
                <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" />
            </div>

            {/* Данные */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="font-unbounded text-xl md:text-2xl font-bold truncate">{fullName}</h1>
                <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${role.bg} ${role.color}`}>
                  {role.label}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-white/45 truncate">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                <span className="text-xs text-gray-400 dark:text-white/35">Аккаунт активен</span>
              </div>
            </div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl mb-6 w-fit">
          {(["info", "security"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-white/45 hover:text-gray-700 dark:hover:text-white/70"
              }`}
            >
              {tab === "info" ? (
                <span className="flex items-center gap-2">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Личные данные
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Безопасность
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Вкладка: Личные данные */}
        {activeTab === "info" && (
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="font-unbounded text-lg font-bold">Личные данные</h2>
              <p className="text-sm text-gray-500 dark:text-white/45 mt-1">Обновите своё имя и контактную информацию</p>
            </div>

            <form onSubmit={handleInfoSubmit} className="space-y-5">
              {errorInfo && <Alert type="error" message={errorInfo} />}
              {successInfo && <Alert type="success" message="Данные успешно сохранены!" />}

              {/* Email — только чтение */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/65 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-gray-400">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="w-full bg-gray-50 dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-xl pl-9 pr-4 py-3 text-sm text-gray-500 dark:text-white/40 cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-white/25 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded">только чтение</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-white/30 mt-1.5">Для смены email обратитесь к администратору</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  label="Фамилия"
                  value={form.lastname}
                  onChange={(v) => setForm((f) => ({ ...f, lastname: v }))}
                  placeholder="Иванов"
                  required
                />
                <FormField
                  label="Имя"
                  value={form.firstname}
                  onChange={(v) => setForm((f) => ({ ...f, firstname: v }))}
                  placeholder="Иван"
                  required
                />
              </div>

              <FormField
                label="Отчество"
                value={form.fathername}
                onChange={(v) => setForm((f) => ({ ...f, fathername: v }))}
                placeholder="Иванович"
              />

              {/* Роль — только чтение */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/65 mb-2">Роль в системе</label>
                <div className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border ${role.bg} ${role.color}`}>
                  <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                  {role.label}
                </div>
                <p className="text-xs text-gray-400 dark:text-white/30 mt-1.5">Роль назначается администратором</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#603EF9] hover:bg-[#4A2ED6] text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      Сохранить изменения
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Вкладка: Безопасность */}
        {activeTab === "security" && (
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="font-unbounded text-lg font-bold">Смена пароля</h2>
              <p className="text-sm text-gray-500 dark:text-white/45 mt-1">Используйте надёжный пароль длиной не менее 6 символов</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
              {errorPwd && <Alert type="error" message={errorPwd} />}
              {successPwd && <Alert type="success" message="Пароль успешно изменён!" />}

              <PasswordField
                label="Текущий пароль"
                value={passwords.currentPassword}
                onChange={(v) => setPasswords((p) => ({ ...p, currentPassword: v }))}
                show={showCurrentPwd}
                onToggle={() => setShowCurrentPwd((s) => !s)}
                placeholder="Введите текущий пароль"
                required
              />
              <PasswordField
                label="Новый пароль"
                value={passwords.newPassword}
                onChange={(v) => setPasswords((p) => ({ ...p, newPassword: v }))}
                show={showNewPwd}
                onToggle={() => setShowNewPwd((s) => !s)}
                placeholder="Минимум 6 символов"
                required
              />
              <PasswordField
                label="Подтвердите новый пароль"
                value={passwords.confirmPassword}
                onChange={(v) => setPasswords((p) => ({ ...p, confirmPassword: v }))}
                show={showConfirmPwd}
                onToggle={() => setShowConfirmPwd((s) => !s)}
                placeholder="Повторите новый пароль"
                required
              />

              {/* Индикатор силы пароля */}
              {passwords.newPassword && (
                <PasswordStrength password={passwords.newPassword} />
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPwd}
                  className="flex items-center gap-2 bg-[#603EF9] hover:bg-[#4A2ED6] text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {savingPwd ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Изменение...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Изменить пароль
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Дополнительная инфо */}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-white/70 mb-3">Советы по безопасности</h3>
              <ul className="space-y-2">
                {[
                  "Используйте уникальный пароль, который нигде больше не применяется",
                  "Не передавайте данные для входа третьим лицам",
                  "При подозрении на взлом немедленно смените пароль",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-500 dark:text-white/40">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 mt-0.5 text-[#603EF9]">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Вспомогательные компоненты ───────────────────────────────────────────────

function FormField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-white/65 mb-2">
        {label}
        {required && <span className="text-[#603EF9] ml-1">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/15 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:border-[#603EF9]/50 focus:ring-1 focus:ring-[#603EF9]/30 transition-all"
      />
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-white/65 mb-2">
        {label}
        {required && <span className="text-[#603EF9] ml-1">*</span>}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-gray-400">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/15 rounded-xl pl-9 pr-10 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:border-[#603EF9]/50 focus:ring-1 focus:ring-[#603EF9]/30 transition-all"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/60 transition-colors"
        >
          {show ? (
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "Не менее 6 символов", pass: password.length >= 6 },
    { label: "Заглавная буква", pass: /[A-ZА-Я]/.test(password) },
    { label: "Цифра", pass: /\d/.test(password) },
    { label: "Спецсимвол", pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
  const passed = checks.filter((c) => c.pass).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-400"];
  const labels = ["Слабый", "Удовлетворительный", "Хороший", "Надёжный"];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < passed ? colors[passed - 1] : "bg-gray-200 dark:bg-white/10"}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-white/40">
        Пароль: <span className={`font-medium ${passed >= 3 ? "text-emerald-500" : passed >= 2 ? "text-yellow-500" : "text-red-500"}`}>{labels[Math.max(0, passed - 1)]}</span>
      </p>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className={c.pass ? "text-emerald-500" : "text-gray-300 dark:text-white/20"}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className={`text-xs ${c.pass ? "text-gray-600 dark:text-white/60" : "text-gray-400 dark:text-white/25"}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Alert({ type, message }: { type: "success" | "error"; message: string }) {
  const styles = {
    success: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
    error: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400",
  };
  const icons = {
    success: <polyline points="20 6 9 17 4 12" />,
    error: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </>
    ),
  };

  return (
    <div className={`flex items-center gap-2 border rounded-xl px-4 py-3 text-sm ${styles[type]}`}>
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
        {icons[type]}
      </svg>
      {message}
    </div>
  );
}