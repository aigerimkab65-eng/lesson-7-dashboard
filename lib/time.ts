import { TIMEZONE } from "@/lib/constants";
import type { PeriodKey, PeriodRange } from "@/lib/types";

const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Части календарной даты в Asia/Almaty */
export function getAlmatyParts(date: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** UTC-момент начала календарного дня в Asia/Almaty */
export function startOfAlmatyDay(date: Date): Date {
  const { year, month, day } = getAlmatyParts(date);
  return new Date(Date.UTC(year, month - 1, day) - ALMATY_OFFSET_MS);
}

/** Конец календарного дня (включительно до следующей полуночи) */
export function endOfAlmatyDay(date: Date): Date {
  const start = startOfAlmatyDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function addAlmatyDays(date: Date, days: number): Date {
  const start = startOfAlmatyDay(date);
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

export function almatyDayKey(date: Date): string {
  const { year, month, day } = getAlmatyParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function almatyMonthKey(date: Date): string {
  const { year, month } = getAlmatyParts(date);
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Начало месяца в Asia/Almaty */
export function startOfAlmatyMonth(date: Date): Date {
  const { year, month } = getAlmatyParts(date);
  return new Date(Date.UTC(year, month - 1, 1) - ALMATY_OFFSET_MS);
}

export function addAlmatyMonths(date: Date, months: number): Date {
  const { year, month, day } = getAlmatyParts(date);
  const total = year * 12 + (month - 1) + months;
  const nextYear = Math.floor(total / 12);
  const nextMonth = total % 12;
  const daysInMonth = new Date(Date.UTC(nextYear, nextMonth + 1, 0)).getUTCDate();
  const safeDay = Math.min(day, daysInMonth);
  return new Date(Date.UTC(nextYear, nextMonth, safeDay) - ALMATY_OFFSET_MS);
}

export function isInRange(date: Date | string, start: Date, end: Date): boolean {
  const t = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export function getPeriodRange(period: PeriodKey, now: Date): PeriodRange {
  const todayStart = startOfAlmatyDay(now);
  const todayEnd = endOfAlmatyDay(now);

  if (period === "week") {
    const start = addAlmatyDays(todayStart, -6);
    return {
      start,
      end: todayEnd,
      label: "последние 7 дней",
      previousLabel: "к предыдущим 7 дням",
    };
  }

  if (period === "month") {
    const start = addAlmatyDays(todayStart, -29);
    return {
      start,
      end: todayEnd,
      label: "последние 30 дней",
      previousLabel: "к предыдущим 30 дням",
    };
  }

  // year = last 12 calendar months including current month
  const currentMonthStart = startOfAlmatyMonth(now);
  const start = startOfAlmatyMonth(addAlmatyMonths(currentMonthStart, -11));
  return {
    start,
    end: todayEnd,
    label: "последние 12 месяцев",
    previousLabel: "к предыдущим 12 месяцам",
  };
}

export function getPreviousPeriodRange(period: PeriodKey, now: Date): PeriodRange {
  const current = getPeriodRange(period, now);

  if (period === "week") {
    const end = new Date(current.start.getTime() - 1);
    const start = addAlmatyDays(current.start, -7);
    return {
      start,
      end,
      label: "предыдущие 7 дней",
      previousLabel: "",
    };
  }

  if (period === "month") {
    const end = new Date(current.start.getTime() - 1);
    const start = addAlmatyDays(current.start, -30);
    return {
      start,
      end,
      label: "предыдущие 30 дней",
      previousLabel: "",
    };
  }

  const end = new Date(current.start.getTime() - 1);
  const start = startOfAlmatyMonth(addAlmatyMonths(current.start, -12));
  return {
    start,
    end,
    label: "предыдущие 12 месяцев",
    previousLabel: "",
  };
}

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  week: "Неделя",
  month: "Месяц",
  year: "Год",
};
