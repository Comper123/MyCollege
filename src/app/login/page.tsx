// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      if (email && password) {
        console.log("Вход выполнен:", { email, role });
        router.push("/dashboard");
      } else {
        setError("Неверный логин или пароль");
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <main className="">
      {/* Фоновый слой */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-gray-50 dark:bg-gradient-to-b dark:from-[#0c0b18]/90 dark:via-[#0c0b18]/95 dark:to-[#0c0b18]"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.08,
          }}
        />
        <div className="hidden dark:block absolute inset-0 bg-[linear-gradient(rgba(96,62,249,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(96,62,249,0.05)_1px,transparent_1px)] bg-[length:48px_48px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(96,62,249,0.08)_0%,transparent_70%)] pointer-events-none animate-float" />
      </div>

      {/* Форма входа */}
      <div className="relative z-10 flex items-center justify-center max-h-[calc(100vh-80px)] px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[#603EF9]/15 border border-[#603EF9]/35 text-[#603EF9] dark:text-[#b5a8ff] text-xs font-semibold tracking-wide uppercase px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#603EF9] shadow-[0_0_8px_#603EF9] animate-pulse-slow" />
              Доступ в систему
            </div>
            <h1 className="font-unbounded text-3xl md:text-4xl font-bold mb-3">
              Вход в <span className="text-[#603EF9]">Мой ПТК</span>
            </h1>
            <p className="text-gray-600 dark:text-white/55 text-sm md:text-base">
              Войдите в систему учёта оборудования
            </p>
          </div>

          <div className="bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-lg dark:shadow-none">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">Email / Логин</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-black">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/15 rounded-xl px-10 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-[#603EF9]/50 focus:ring-1 focus:ring-[#603EF9]/30 transition-all"
                    placeholder="ivanov@novsu.ru"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">Пароль</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-black">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/15 rounded-xl px-10 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-[#603EF9]/50 focus:ring-1 focus:ring-[#603EF9]/30 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>  
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#603EF9] hover:bg-[#4A2ED6] text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Вход...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Войти в систему
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes float {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.08;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.05;
          }
        }
        .animate-pulse-slow {
          animation: pulse 2s ease infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}