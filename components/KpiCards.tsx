"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight, Info } from "lucide-react";
import type { KpiCardData } from "@/lib/types";

interface KpiCardsProps {
  cards: KpiCardData[];
}

function ChangeIcon({ direction }: { direction: KpiCardData["change"]["direction"] }) {
  if (direction === "up") {
    return <ArrowUpRight className="h-4 w-4" aria-hidden />;
  }
  if (direction === "down") {
    return <ArrowDownRight className="h-4 w-4" aria-hidden />;
  }
  if (direction === "flat") {
    return <ArrowRight className="h-4 w-4" aria-hidden />;
  }
  return null;
}

function changeTone(direction: KpiCardData["change"]["direction"]) {
  if (direction === "up") return "text-success";
  if (direction === "down") return "text-danger";
  return "text-muted";
}

function changeSignText(direction: KpiCardData["change"]["direction"]) {
  if (direction === "up") return "рост";
  if (direction === "down") return "снижение";
  if (direction === "flat") return "без изменений";
  return "нет базы сравнения";
}

export function KpiCards({ cards }: KpiCardsProps) {
  return (
    <section
      aria-label="Ключевые показатели"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card, index) => (
        <article
          key={card.key}
          className="card-enter rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow)]"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-sm font-medium text-muted">{card.title}</h2>
            <span className="group relative inline-flex">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted transition hover:bg-surface-soft hover:text-foreground"
                aria-label={`Как считается: ${card.title}`}
                title={card.hint}
              >
                <Info className="h-4 w-4" aria-hidden />
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute top-full right-0 z-20 mt-1 w-56 rounded-xl border border-border bg-foreground px-3 py-2 text-xs leading-relaxed text-accent-contrast opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100"
              >
                {card.hint}
              </span>
            </span>
          </div>

          <p className="font-display mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.7rem]">
            {card.displayValue}
          </p>

          <div className={`mt-3 flex flex-wrap items-center gap-2 text-sm ${changeTone(card.change.direction)}`}>
            <ChangeIcon direction={card.change.direction} />
            <span className="font-semibold">{card.changeLabel}</span>
            <span className="sr-only">{changeSignText(card.change.direction)}</span>
            <span aria-hidden className="text-xs font-medium">
              ({changeSignText(card.change.direction)})
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">{card.comparisonCaption}</p>
        </article>
      ))}
    </section>
  );
}
