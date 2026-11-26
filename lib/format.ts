import { TIMEZONE } from "@/lib/constants";

/** Формат суммы: «1 234 567 ₸» */
export function formatTenge(amount: number): string {
  const formatted = new Intl.NumberFormat("ru-RU").format(Math.round(amount));
  return `${formatted} ₸`;
}

/** Короткая ось Y: «120 тыс», «1,2 млн» */
export function formatTengeShort(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    const millions = amount / 1_000_000;
    const text = new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: millions >= 10 ? 0 : 1,
    }).format(millions);
    return `${text} млн`;
  }
  if (abs >= 1000) {
    const thousands = amount / 1000;
    const text = new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: thousands >= 100 ? 0 : 0,
    }).format(Math.round(thousands));
    return `${text} тыс`;
  }
  return new Intl.NumberFormat("ru-RU").format(Math.round(amount));
}

export function formatPercentChange(percent: number | null): string {
  if (percent === null || !Number.isFinite(percent)) {
    return "—";
  }
  const rounded = Math.round(percent);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}%`;
}

export function formatDateRu(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateShortRu(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatMonthRu(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: TIMEZONE,
    month: "short",
  }).format(date);
}

export function toCsvDate(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  return `${day}.${month}.${year}`;
}

export function toFileDateStamp(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}
