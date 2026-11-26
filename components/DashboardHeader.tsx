"use client";

import { MessageCircle, RotateCcw, Send } from "lucide-react";
import {
  BRAND_CITY,
  BRAND_NAME,
  BRAND_ROLE,
  PROJECT_NAME,
  TELEGRAM_DISPLAY,
  TELEGRAM_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from "@/lib/constants";

interface DashboardHeaderProps {
  onResetDemo: () => void;
}

export function DashboardHeader({ onResetDemo }: DashboardHeaderProps) {
  return (
    <header className="card-enter rounded-[28px] border border-border bg-surface/90 p-5 shadow-[var(--shadow)] backdrop-blur-sm sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            {BRAND_NAME} · {BRAND_ROLE} · {BRAND_CITY}
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {PROJECT_NAME}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Спокойная панель студии: ключевые метрики, динамика выручки и заказы.
            Данные демонстрационные — удобно показать клиентам.
          </p>
          <p className="mt-3 inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            Демо-данные
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex flex-wrap gap-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              WhatsApp {WHATSAPP_DISPLAY}
            </a>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
            >
              <Send className="h-4 w-4" aria-hidden />
              Telegram {TELEGRAM_DISPLAY}
            </a>
          </div>
          <button
            type="button"
            onClick={onResetDemo}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-3 text-sm font-medium text-muted transition hover:bg-surface-soft hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Сбросить демо-данные
          </button>
        </div>
      </div>
    </header>
  );
}
