// src/components/ui/ConfirmDeleteModal.tsx
"use client";

import { useEffect, useRef, ReactNode } from "react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;

  // Кастомизация
  title?: string;
  description?: string | ReactNode;
  confirmText?: string;
  cancelText?: string;

  // Дополнительный контекст — например, имя удаляемого объекта
  target?: string;

  // Блокировать кнопку (например, пока идёт запрос)
  isLoading?: boolean;

  // Сменить акцент с красного на другой цвет (редко, но бывает)
  danger?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Подтвердите удаление",
  description,
  confirmText = "Удалить",
  cancelText = "Отмена",
  target,
  isLoading = false,
  danger = true,
}: ConfirmDeleteModalProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Фокус на кнопку подтверждения при открытии
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultDescription = target
    ? <>Вы собираетесь удалить <span className="font-semibold text-gray-900 dark:text-white">«{target}»</span>. Это действие необратимо.</>
    : "Это действие необратимо. Вы уверены, что хотите продолжить?";

  return (
    // Оверлей
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Карточка */}
      <div className="relative w-full max-w-sm bg-white dark:bg-[#13121f] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden animate-modal-in">

        {/* Верхняя красная полоска-акцент */}
        {danger && (
          <div className="h-1 w-full bg-gradient-to-r from-red-500 to-red-400" />
        )}

        <div className="p-6">
          {/* Иконка */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
            danger
              ? "bg-red-50 dark:bg-red-500/10"
              : "bg-yellow-50 dark:bg-yellow-500/10"
          }`}>
            <svg
              width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
              className={danger ? "text-red-500" : "text-yellow-500"}
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>

          {/* Заголовок */}
          <h2
            id="confirm-delete-title"
            className="font-unbounded text-base font-bold text-gray-900 dark:text-white mb-2"
          >
            {title}
          </h2>

          {/* Описание */}
          <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed">
            {description ?? defaultDescription}
          </p>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              danger
                ? "bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 dark:focus:ring-offset-[#13121f]"
                : "bg-yellow-500 hover:bg-yellow-600"
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Удаление...
              </>
            ) : confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        .animate-modal-in {
          animation: modal-in 0.18s ease both;
        }
      `}</style>
    </div>
  );
}