"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { UserRole } from "@/lib/db/schema";

interface UserRecord {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  fathername?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Администратор",
  laborant: "Лаборант",
  teacher: "Преподаватель",
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-[#603EF9]/10 text-[#603EF9] dark:bg-[#603EF9]/20 dark:text-[#b5a8ff]",
  laborant: "bg-[#1d9e75]/10 text-[#1d9e75] dark:bg-[#1d9e75]/20 dark:text-[#6de0b8]",
  teacher: "bg-[#ba7517]/10 text-[#ba7517] dark:bg-[#ba7517]/20 dark:text-[#ffc15e]",
};

function fullName(u: UserRecord) {
  return [u.lastname, u.firstname, u.fathername].filter(Boolean).join(" ");
}

function initials(u: UserRecord) {
  return ((u.firstname?.[0] ?? "") + (u.lastname?.[0] ?? "")).toUpperCase() || "?";
}

function avatarGradient(role: UserRole) {
  if (role === "admin") return "from-[#603EF9] to-[#4A2ED6]";
  if (role === "laborant") return "from-[#1d9e75] to-[#148a63]";
  return "from-[#ba7517] to-[#9a6012]";
}

function generatePassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => chars[b % chars.length])
    .join("");
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-medium transition-all
        ${type === "success"
          ? "bg-white dark:bg-[#1a1a2e] border-[#1d9e75]/30 text-[#1d9e75] dark:text-[#6de0b8]"
          : "bg-white dark:bg-[#1a1a2e] border-red-300/30 text-red-600 dark:text-red-400"
        }`}
    >
      {type === "success" ? (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      {message}
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ─── Modal: Create user ───────────────────────────────────────────────────────

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: (u: UserRecord) => void }) {
  const [form, setForm] = useState({
    firstname: "", lastname: "", fathername: "", email: "", role: "teacher" as UserRole, password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onCreated(data.user);
    } catch { setError("Ошибка сети"); }
    finally { setLoading(false); }
  };

  const genPassword = () => {
    const p = generatePassword();
    setForm(f => ({ ...f, password: p }));
    setShowPass(true);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#13122a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-unbounded text-lg font-bold text-gray-900 dark:text-white">Новый пользователь</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1.5">Фамилия *</label>
              <input value={form.lastname} onChange={e => setForm(f => ({ ...f, lastname: e.target.value }))} required
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#603EF9]/50 transition-all" placeholder="Иванов" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1.5">Имя *</label>
              <input value={form.firstname} onChange={e => setForm(f => ({ ...f, firstname: e.target.value }))} required
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#603EF9]/50 transition-all" placeholder="Иван" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1.5">Отчество</label>
            <input value={form.fathername} onChange={e => setForm(f => ({ ...f, fathername: e.target.value }))}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#603EF9]/50 transition-all" placeholder="Иванович" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#603EF9]/50 transition-all" placeholder="ivanov@novsu.ru" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1.5">Роль *</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#603EF9]/50 transition-all">
              <option value="teacher">Преподаватель</option>
              <option value="laborant">Лаборант</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1.5">Пароль *</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type={showPass ? "text" : "password"} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#603EF9]/50 transition-all font-mono" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/70">
                  {showPass
                    ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
                </button>
              </div>
              <button type="button" onClick={genPassword}
                className="px-3 py-2.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-medium text-gray-600 dark:text-white/70 transition-all whitespace-nowrap">
                Сгенерировать
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
              Отмена
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#603EF9] hover:bg-[#4A2ED6] text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: View/Edit user ────────────────────────────────────────────────────

function UserDetailModal({ user: initialUser, onClose, onUpdated, onDeleted, currentAdminId }: {
  user: UserRecord;
  onClose: () => void;
  onUpdated: (u: UserRecord) => void;
  onDeleted: (id: string) => void;
  currentAdminId: string;
}) {
  const [user, setUser] = useState(initialUser);
  const [tab, setTab] = useState<"info" | "password" | "danger">("info");
  const [editForm, setEditForm] = useState({ firstname: user.firstname, lastname: user.lastname, fathername: user.fathername ?? "", email: user.email, role: user.role });
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSelf = user.id === currentAdminId;

  const patch = useCallback(async (body: object) => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return null; }
      return data.user as UserRecord;
    } catch { setError("Ошибка сети"); return null; }
    finally { setLoading(false); }
  }, [user.id]);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await patch(editForm);
    if (updated) { setUser(updated); onUpdated(updated); }
  };

  const handleToggleActive = async () => {
    const updated = await patch({ isActive: !user.isActive });
    if (updated) { setUser(updated); onUpdated(updated); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError("Пароль должен быть не менее 6 символов"); return; }
    const updated = await patch({ newPassword });
    if (updated) { setNewPassword(""); setError(""); onUpdated(updated); }
  };

  const handleDelete = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      onDeleted(user.id);
    } catch { setError("Ошибка сети"); }
    finally { setLoading(false); }
  };

  const genPassword = () => { setNewPassword(generatePassword()); setShowPass(true); };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#13122a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarGradient(user.role)} flex items-center justify-center text-white font-bold text-base shrink-0`}>
            {initials(user)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 dark:text-white text-base truncate">{fullName(user)}</div>
            <div className="text-sm text-gray-500 dark:text-white/50 truncate">{user.email}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-white/10 px-6">
          {(["info", "password", "danger"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(""); }}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-all -mb-px ${tab === t
                ? "border-[#603EF9] text-[#603EF9] dark:text-[#b5a8ff]"
                : "border-transparent text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70"
              }`}>
              {t === "info" ? "Данные" : t === "password" ? "Пароль" : "Опасная зона"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* TAB: Info */}
          {tab === "info" && (
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1.5">Фамилия *</label>
                  <input value={editForm.lastname} onChange={e => setEditForm(f => ({ ...f, lastname: e.target.value }))} required
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#603EF9]/50 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1.5">Имя *</label>
                  <input value={editForm.firstname} onChange={e => setEditForm(f => ({ ...f, firstname: e.target.value }))} required
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#603EF9]/50 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1.5">Отчество</label>
                <input value={editForm.fathername} onChange={e => setEditForm(f => ({ ...f, fathername: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#603EF9]/50 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1.5">Email *</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#603EF9]/50 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1.5">Роль *</label>
                <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  disabled={isSelf}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#603EF9]/50 transition-all disabled:opacity-50">
                  <option value="teacher">Преподаватель</option>
                  <option value="laborant">Лаборант</option>
                  {/* <option value="admin">Администратор</option> */}
                </select>
              </div>

              {/* Активность */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Учётная запись активна</div>
                  <div className="text-xs text-gray-500 dark:text-white/40 mt-0.5">Пользователь может входить в систему</div>
                </div>
                <button type="button" onClick={handleToggleActive} disabled={loading || isSelf}
                  className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${user.isActive ? "bg-[#603EF9]" : "bg-gray-300 dark:bg-white/20"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${user.isActive ? "translate-x-5" : ""}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                  Отмена
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-[#603EF9] hover:bg-[#4A2ED6] text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  Сохранить
                </button>
              </div>
            </form>
          )}

          {/* TAB: Password */}
          {tab === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm">
                После смены пароля все активные сессии пользователя будут завершены.
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1.5">Новый пароль</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showPass ? "text" : "password"} value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} required minLength={6}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 pr-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#603EF9]/50 transition-all font-mono"
                      placeholder="Минимум 6 символов" />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/70">
                      {showPass
                        ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      }
                    </button>
                  </div>
                  <button type="button" onClick={genPassword}
                    className="px-3 py-2.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-medium text-gray-600 dark:text-white/70 transition-all whitespace-nowrap">
                    Сгенерировать
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                Сбросить пароль
              </button>
            </form>
          )}

          {/* TAB: Danger */}
          {tab === "danger" && (
            <div className="space-y-4">
              {isSelf ? (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/40 text-sm text-center">
                  Нельзя удалить собственную учётную запись
                </div>
              ) : !confirmDelete ? (
                <div className="p-5 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10">
                  <div className="font-semibold text-red-700 dark:text-red-400 mb-1 text-sm">Удалить пользователя</div>
                  <div className="text-xs text-red-600/80 dark:text-red-400/70 mb-4">
                    Это действие необратимо. Все данные пользователя будут удалены.
                  </div>
                  <button onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all">
                    Удалить учётную запись
                  </button>
                </div>
              ) : (
                <div className="p-5 rounded-xl border-2 border-red-500 dark:border-red-500/60 bg-red-50 dark:bg-red-500/10">
                  <div className="font-semibold text-red-700 dark:text-red-400 mb-1 text-sm">Вы уверены?</div>
                  <div className="text-xs text-red-600/80 dark:text-red-400/70 mb-4">
                    Пользователь <strong>{fullName(user)}</strong> будет удалён без возможности восстановления.
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                      Отмена
                    </button>
                    <button onClick={handleDelete} disabled={loading}
                      className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                      {loading && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                      Да, удалить
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [showCreate, setShowCreate] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  }, []);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && currentUser && currentUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [authLoading, currentUser, router]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreated = (u: UserRecord) => {
    setUsers(prev => [u, ...prev]);
    setShowCreate(false);
    showToast(`Пользователь ${fullName(u)} создан`);
  };

  const handleUpdated = (u: UserRecord) => {
    setUsers(prev => prev.map(x => x.id === u.id ? u : x));
    if (selectedUser?.id === u.id) setSelectedUser(u);
    showToast("Данные сохранены");
  };

  const handleDeleted = (id: string) => {
    setUsers(prev => prev.filter(x => x.id !== id));
    setSelectedUser(null);
    showToast("Пользователь удалён");
  };

  // Filtering
  const filtered = users.filter(u => {
    const nameMatch = [u.firstname, u.lastname, u.fathername, u.email].join(" ").toLowerCase().includes(search.toLowerCase());
    const roleMatch = roleFilter === "all" || u.role === roleFilter;
    const statusMatch = statusFilter === "all" || (statusFilter === "active" ? u.isActive : !u.isActive);
    return nameMatch && roleMatch && statusMatch;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    admins: users.filter(u => u.role === "admin").length,
    laborants: users.filter(u => u.role === "laborant").length,
    teachers: users.filter(u => u.role === "teacher").length,
  };

  if (authLoading || (currentUser && currentUser.role !== "admin")) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#603EF9] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0c0b18] pb-12">
      {/* Page header */}
      <div className="bg-white dark:bg-[#13122a]/80 border-b border-gray-200 dark:border-white/10 px-6 md:px-10 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-unbounded text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Управление пользователями</h1>
            <p className="text-sm text-gray-500 dark:text-white/45 mt-1">Создание, редактирование и удаление учётных записей</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#603EF9] hover:bg-[#4A2ED6] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Добавить пользователя
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 pt-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Всего", value: stats.total, color: "text-gray-900 dark:text-white" },
            { label: "Активных", value: stats.active, color: "text-[#1d9e75] dark:text-[#6de0b8]" },
            { label: "Администраторов", value: stats.admins, color: "text-[#603EF9] dark:text-[#b5a8ff]" },
            { label: "Лаборантов", value: stats.laborants, color: "text-[#1d9e75] dark:text-[#6de0b8]" },
            { label: "Преподавателей", value: stats.teachers, color: "text-[#ba7517] dark:text-[#ffc15e]" },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-center">
              <div className={`font-unbounded text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени или email..."
              className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-[#603EF9]/50 transition-all" />
          </div>

          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as typeof roleFilter)}
            className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#603EF9]/50 transition-all">
            <option value="all">Все роли</option>
            <option value="admin">Администратор</option>
            <option value="laborant">Лаборант</option>
            <option value="teacher">Преподаватель</option>
          </select>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#603EF9]/50 transition-all">
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>

          <button onClick={fetchUsers} className="p-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 text-gray-500 dark:text-white/50 transition-all">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#603EF9] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-white/30">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <div className="text-sm">Пользователи не найдены</div>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-6 py-3 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">
                <div className="w-10" />
                <div>Пользователь</div>
                <div>Роль</div>
                <div>Статус</div>
                <div>Дата</div>
              </div>

              {filtered.map((u, idx) => (
                <button key={u.id} onClick={() => setSelectedUser(u)}
                  className={`w-full text-left grid md:grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${idx < filtered.length - 1 ? "border-b border-gray-100 dark:border-white/10" : ""}`}>
                  
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient(u.role)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {initials(u)}
                  </div>

                  {/* Name & email */}
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{fullName(u)}</div>
                    <div className="text-xs text-gray-500 dark:text-white/40 truncate">{u.email}</div>
                  </div>

                  {/* Role */}
                  <div className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${ROLE_COLORS[u.role]}`}>
                    {ROLE_LABELS[u.role]}
                  </div>

                  {/* Status */}
                  <div className={`flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${u.isActive ? "text-[#1d9e75] dark:text-[#6de0b8]" : "text-gray-400 dark:text-white/30"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-[#1d9e75]" : "bg-gray-300 dark:bg-white/20"}`} />
                    {u.isActive ? "Активен" : "Неактивен"}
                  </div>

                  {/* Date */}
                  <div className="text-xs text-gray-400 dark:text-white/30 whitespace-nowrap hidden md:block">
                    {new Date(u.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-400 dark:text-white/30 text-center">
          Показано {filtered.length} из {users.length} пользователей
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
      {selectedUser && currentUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
          currentAdminId={currentUser.id}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}