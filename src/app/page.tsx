// src/app/page.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".reveal").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-white dark:bg-[#0c0b18] text-gray-900 dark:text-white font-golos overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 py-20 overflow-hidden">
        {/* Фоновое изображение с улучшенной читаемостью */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white dark:from-[#0c0b18]/95 dark:via-[#0c0b18]/90 dark:to-[#0c0b18]"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundAttachment: "fixed",
            }}
          />
        </div>

        {/* Светлая версия сетки-декора */}
        <div className="absolute inset-0 z-1 bg-[linear-gradient(rgba(96,62,249,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(96,62,249,0.04)_1px,transparent_1px)] bg-[length:48px_48px] [mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.3)_30%,rgba(0,0,0,0.3)_70%,transparent_100%)]" />

        {/* Световой акцент - адаптирован под светлую тему */}
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(96,62,249,0.12)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(96,62,249,0.22)_0%,transparent_70%)] z-1 pointer-events-none animate-float" />

        <div className="relative z-2 max-w-[860px]">
          <div className="inline-flex items-center gap-2 bg-[#603EF9]/10 dark:bg-[#603EF9]/15 border border-[#603EF9]/30 dark:border-[#603EF9]/35 text-[#603EF9] dark:text-[#b5a8ff] text-xs font-semibold tracking-wide uppercase px-4 py-1.5 rounded-full mb-8 animate-fadeUp">
            <span className="w-1.5 h-1.5 rounded-full bg-[#603EF9] shadow-[0_0_8px_#603EF9] animate-pulse-slow" />
            Политехнический колледж ПТИ НовГУ
          </div>

          <h1 className="font-unbounded text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-[-0.02em] mb-6 animate-fadeUp animation-delay-100 text-gray-900 dark:text-white">
            Учёт оборудования<br />и работы <span className="text-[#603EF9]">лаборантов</span>
          </h1>

          <p className="text-base md:text-lg text-gray-700 dark:text-white/70 leading-relaxed max-w-[580px] mx-auto mb-10 animate-fadeUp animation-delay-200">
            Централизованная информационная система для инвентаризации, отслеживания перемещений
            и планирования обслуживания техники — всё в одном месте.
          </p>

          <div className="flex gap-4 justify-center flex-wrap animate-fadeUp animation-delay-300">
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 bg-[#603EF9] text-white font-golos text-sm md:text-base font-semibold px-8 py-3.5 rounded-xl hover:bg-[#4A2ED6] hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-xl no-underline"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Войти в систему
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2.5 bg-white/80 dark:bg-transparent text-gray-700 dark:text-white/85 font-golos text-sm md:text-base font-medium px-8 py-3.5 rounded-xl border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-[#603EF9] dark:hover:border-white/35 hover:-translate-y-0.5 transition-all no-underline shadow-sm hover:shadow-md"
            >
              Узнать подробнее
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Декоративная стрелка вниз */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-400 dark:text-white/40">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* STATS BAND - адаптирован под светлую тему */}
      <div className="flex justify-center gap-0 border-y border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 backdrop-blur-sm py-8 px-6 flex-wrap">
        <div className="flex-1 min-w-[180px] text-center py-4 px-8 border-r border-gray-200 dark:border-white/10 last:border-r-0 md:border-r md:last:border-r-0 max-md:border-b max-md:last:border-b-0 reveal">
          <span className="font-unbounded text-3xl md:text-4xl font-bold text-[#603EF9] block">100%</span>
          <span className="text-xs text-gray-600 dark:text-white/50 mt-1 block">Централизованный учёт</span>
        </div>
        <div className="flex-1 min-w-[180px] text-center py-4 px-8 border-r border-gray-200 dark:border-white/10 last:border-r-0 md:border-r md:last:border-r-0 max-md:border-b max-md:last:border-b-0 reveal">
          <span className="font-unbounded text-3xl md:text-4xl font-bold text-[#603EF9] block">3</span>
          <span className="text-xs text-gray-600 dark:text-white/50 mt-1 block">Роли пользователей</span>
        </div>
        <div className="flex-1 min-w-[180px] text-center py-4 px-8 border-r border-gray-200 dark:border-white/10 last:border-r-0 md:border-r md:last:border-r-0 max-md:border-b max-md:last:border-b-0 reveal">
          <span className="font-unbounded text-3xl md:text-4xl font-bold text-[#603EF9] block">24/7</span>
          <span className="text-xs text-gray-600 dark:text-white/50 mt-1 block">Доступ через браузер</span>
        </div>
        <div className="flex-1 min-w-[180px] text-center py-4 px-8 border-r border-gray-200 dark:border-white/10 last:border-r-0 md:border-r md:last:border-r-0 max-md:border-b max-md:last:border-b-0 reveal">
          <span className="font-unbounded text-3xl md:text-4xl font-bold text-[#603EF9] block">≤2с</span>
          <span className="text-xs text-gray-600 dark:text-white/50 mt-1 block">Время отклика системы</span>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <section id="features" className="max-w-[1100px] mx-auto py-24 px-6">
        <p className="text-xs font-semibold tracking-[0.1em] uppercase text-[#603EF9] mb-4 reveal">Возможности</p>
        <h2 className="font-unbounded text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.15] mb-4 reveal text-gray-900 dark:text-white">
          Всё необходимое<br />для управления техникой
        </h2>
        <p className="text-base md:text-lg text-gray-600 dark:text-white/55 max-w-[520px] leading-relaxed mb-12 reveal">
          Система «Мой ПТК» автоматизирует ключевые процессы колледжа —
          от инвентаризации до списания оборудования.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-7 hover:border-[#603EF9]/40 hover:shadow-lg transition-all reveal">
              <div className="w-11 h-11 bg-[#603EF9]/10 dark:bg-[#603EF9]/15 rounded-xl flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <div className="font-golos text-base font-semibold mb-2 text-gray-900 dark:text-white">{feature.title}</div>
              <div className="text-sm text-gray-600 dark:text-white/50 leading-relaxed">{feature.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how" className="bg-gray-50/50 dark:bg-white/5 border-y border-gray-200 dark:border-white/10">
        <div className="max-w-[1100px] mx-auto py-24 px-6">
          <p className="text-xs font-semibold tracking-[0.1em] uppercase text-[#603EF9] mb-4 reveal">Как это работает</p>
          <h2 className="font-unbounded text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.15] mb-4 reveal text-gray-900 dark:text-white">Просто и понятно</h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-white/55 max-w-[520px] leading-relaxed mb-12 reveal">Несколько шагов — и вся техника колледжа под контролем.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="reveal">
                <div className="font-unbounded text-4xl md:text-5xl font-bold text-[#603EF9]/40 leading-none mb-3">0{index + 1}</div>
                <div className="font-semibold text-base mb-2 text-gray-900 dark:text-white">{step.title}</div>
                <div className="text-sm text-gray-600 dark:text-white/50 leading-relaxed">{step.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES SECTION */}
      <section id="roles" className="max-w-[1100px] mx-auto py-24 px-6">
        <p className="text-xs font-semibold tracking-[0.1em] uppercase text-[#603EF9] mb-4 reveal">Роли пользователей</p>
        <h2 className="font-unbounded text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.15] mb-4 reveal text-gray-900 dark:text-white">Каждому — свои задачи</h2>
        <p className="text-base md:text-lg text-gray-600 dark:text-white/55 max-w-[520px] leading-relaxed mb-12 reveal">Система разграничивает доступ в соответствии с обязанностями сотрудников.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl p-6 border border-[#603EF9]/25 bg-gradient-to-br from-[#603EF9]/5 to-[#603EF9]/1 dark:from-[#603EF9]/12 dark:to-[#603EF9]/3 reveal">
            <span className="inline-block text-[11px] font-semibold tracking-[0.07em] uppercase px-2.5 py-0.5 rounded-full bg-[#603EF9]/10 dark:bg-[#603EF9]/20 text-[#603EF9] dark:text-[#b5a8ff] mb-4">Администратор</span>
            <div className="font-semibold text-base md:text-lg mb-3 text-gray-900 dark:text-white">Полный доступ</div>
            <ul className="flex flex-col gap-1.5 list-none">
              <li className="text-sm text-gray-600 dark:text-white/55 flex items-start gap-2"><span className="text-gray-400 dark:text-white/25 shrink-0">—</span>Регистрация новых пользователей</li>
              <li className="text-sm text-gray-600 dark:text-white/55 flex items-start gap-2"><span className="text-gray-400 dark:text-white/25 shrink-0">—</span>Настройка типов оборудования</li>
              <li className="text-sm text-gray-600 dark:text-white/55 flex items-start gap-2"><span className="text-gray-400 dark:text-white/25 shrink-0">—</span>Списание и планирование закупок</li>
              <li className="text-sm text-gray-600 dark:text-white/55 flex items-start gap-2"><span className="text-gray-400 dark:text-white/25 shrink-0">—</span>Просмотр всей отчётности</li>
            </ul>
          </div>

          <div className="rounded-2xl p-6 border border-[#1d9e75]/20 bg-gradient-to-br from-[#1d9e75]/5 to-[#1d9e75]/1 dark:from-[#1d9e75]/10 dark:to-[#1d9e75]/2 reveal">
            <span className="inline-block text-[11px] font-semibold tracking-[0.07em] uppercase px-2.5 py-0.5 rounded-full bg-[#1d9e75]/10 dark:bg-[#1d9e75]/20 text-[#1d9e75] dark:text-[#6de0b8] mb-4">Лаборант</span>
            <div className="font-semibold text-base md:text-lg mb-3 text-gray-900 dark:text-white">Учёт и обслуживание</div>
            <ul className="flex flex-col gap-1.5 list-none">
              <li className="text-sm text-gray-600 dark:text-white/55 flex items-start gap-2"><span className="text-gray-400 dark:text-white/25 shrink-0">—</span>Редактирование закреплённого оборудования</li>
              <li className="text-sm text-gray-600 dark:text-white/55 flex items-start gap-2"><span className="text-gray-400 dark:text-white/25 shrink-0">—</span>Отметка о проведённом ТО</li>
              <li className="text-sm text-gray-600 dark:text-white/55 flex items-start gap-2"><span className="text-gray-400 dark:text-white/25 shrink-0">—</span>Выполнение заявок на ремонт</li>
              <li className="text-sm text-gray-600 dark:text-white/55 flex items-start gap-2"><span className="text-gray-400 dark:text-white/25 shrink-0">—</span>Инвентаризация кабинетов</li>
            </ul>
          </div>

          <div className="rounded-2xl p-6 border border-[#ba7517]/20 bg-gradient-to-br from-[#ba7517]/5 to-[#ba7517]/1 dark:from-[#ba7517]/10 dark:to-[#ba7517]/2 reveal">
            <span className="inline-block text-[11px] font-semibold tracking-[0.07em] uppercase px-2.5 py-0.5 rounded-full bg-[#ba7517]/10 dark:bg-[#ba7517]/20 text-[#ba7517] dark:text-[#ffc15e] mb-4">Преподаватель</span>
            <div className="font-semibold text-base md:text-lg mb-3 text-gray-900 dark:text-white">Контроль и заявки</div>
            <ul className="flex flex-col gap-1.5 list-none">
              <li className="text-sm text-gray-600 dark:text-white/55 flex items-start gap-2"><span className="text-gray-400 dark:text-white/25 shrink-0">—</span>Просмотр оборудования кабинета</li>
              <li className="text-sm text-gray-600 dark:text-white/55 flex items-start gap-2"><span className="text-gray-400 dark:text-white/25 shrink-0">—</span>Формирование заявок на ремонт</li>
              <li className="text-sm text-gray-600 dark:text-white/55 flex items-start gap-2"><span className="text-gray-400 dark:text-white/25 shrink-0">—</span>Подтверждение выполнения работ</li>
              <li className="text-sm text-gray-600 dark:text-white/55 flex items-start gap-2"><span className="text-gray-400 dark:text-white/25 shrink-0">—</span>Редактирование закреплённой техники</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative text-center py-28 px-6 overflow-hidden bg-gradient-to-br from-[#603EF9]/5 to-transparent dark:from-transparent">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[radial-gradient(ellipse,rgba(96,62,249,0.12)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse,rgba(96,62,249,0.25)_0%,transparent_70%)] pointer-events-none animate-float" />
        <h2 className="font-unbounded text-2xl md:text-4xl lg:text-5xl font-bold mb-5 relative z-1 reveal text-gray-900 dark:text-white">Готовы начать работу?</h2>
        <p className="text-gray-600 dark:text-white/55 text-base md:text-lg mb-10 relative z-1 reveal">
          Войдите в систему и получите полный контроль<br />над оборудованием вашего колледжа.
        </p>
        <div className="relative z-1 reveal">
          <Link
            href="/login"
            className="inline-flex items-center gap-2.5 bg-[#603EF9] text-white font-golos text-sm md:text-base font-semibold px-8 py-3.5 rounded-xl hover:bg-[#4A2ED6] hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-xl no-underline"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Войти в систему
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 dark:border-white/10 py-8 px-10 flex items-center justify-between flex-wrap gap-4 max-md:flex-col max-md:text-center bg-white dark:bg-transparent">
        <div className="font-unbounded text-sm text-gray-500 dark:text-white/40">Мой ПТК</div>
        <div className="text-xs text-gray-400 dark:text-white/30"></div>
        <div className="text-xs text-gray-400 dark:text-white/30 text-right max-md:text-center">
          Политехнический колледж ПТИ<br />НовГУ имени Ярослава Мудрого
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes float {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.12;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.08;
          }
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(10px);
          }
        }
        .animate-fadeUp {
          animation: fadeUp 0.6s ease both;
        }
        .animate-pulse-slow {
          animation: pulse 2s ease infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-bounce {
          animation: bounce 2s ease-in-out infinite;
        }
        .animation-delay-100 {
          animation-delay: 0.1s;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </main>
  );
}

// Данные для features
const features = [
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#603EF9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
    title: "Учёт оборудования",
    description: "Ведение полной базы техники: инвентарный номер, характеристики, состояние, история обслуживания и фотографии."
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#603EF9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    title: "Интерактивный план",
    description: "Наглядное отображение кабинетов на плане этажей. Кликните на кабинет — увидите весь список оборудования."
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#603EF9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>,
    title: "Учёт перемещений",
    description: "Отслеживание всех перемещений техники между кабинетами с фиксацией ответственного и причины."
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#603EF9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>,
    title: "Техническое обслуживание",
    description: "Планирование и учёт ТО и ремонтов. История всех работ с указанием исполнителя и даты."
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#603EF9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
    title: "Поиск оборудования",
    description: "Быстрый поиск по названию, модели, серийному номеру или местоположению. Фильтрация по состоянию."
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#603EF9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    title: "Управление пользователями",
    description: "Три роли: администратор, лаборант и преподаватель. Регистрация через заявку с подтверждением."
  }
];

// Данные для шагов
const steps = [
  {
    title: "Войдите в систему",
    description: "Авторизуйтесь по логину и паролю. Доступ — через любой современный браузер на компьютере или планшете."
  },
  {
    title: "Выберите кабинет",
    description: "На интерактивном плане этажа нажмите на нужный кабинет и увидите всё размещённое там оборудование."
  },
  {
    title: "Управляйте техникой",
    description: "Добавляйте, редактируйте, перемещайте оборудование или фиксируйте выполненное обслуживание."
  },
  {
    title: "Формируйте отчёты",
    description: "Администрация получает актуальную отчётность по состоянию и движению техники в любой момент."
  }
];