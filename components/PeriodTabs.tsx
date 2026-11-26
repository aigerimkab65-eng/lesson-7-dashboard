"use client";

import { PERIOD_LABELS } from "@/lib/time";
import type { PeriodKey } from "@/lib/types";

const PERIODS: PeriodKey[] = ["week", "month", "year"];

interface PeriodTabsProps {
  value: PeriodKey;
  onChange: (period: PeriodKey) => void;
  label?: string;
}

export function PeriodTabs({
  value,
  onChange,
  label = "Период",
}: PeriodTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex max-w-full flex-wrap gap-1 rounded-2xl border border-border bg-surface-soft p-1"
    >
      {PERIODS.map((period) => {
        const active = value === period;
        return (
          <button
            key={period}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(period)}
            className={`min-h-11 min-w-11 rounded-xl px-4 text-sm font-medium transition ${
              active
                ? "bg-accent text-accent-contrast shadow-sm"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {PERIOD_LABELS[period]}
          </button>
        );
      })}
    </div>
  );
}
