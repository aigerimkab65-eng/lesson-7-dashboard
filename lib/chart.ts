import { formatDateShortRu, formatMonthRu, formatTenge } from "@/lib/format";
import {
  addAlmatyDays,
  addAlmatyMonths,
  almatyDayKey,
  almatyMonthKey,
  endOfAlmatyDay,
  getPeriodRange,
  isInRange,
  startOfAlmatyDay,
  startOfAlmatyMonth,
} from "@/lib/time";
import type { ChartPoint, Order, PeriodKey } from "@/lib/types";

function paidRevenueInRange(orders: Order[], start: Date, end: Date): number {
  return orders
    .filter(
      (order) =>
        order.status === "Оплачен" && isInRange(order.createdAt, start, end),
    )
    .reduce((sum, order) => sum + order.amount, 0);
}

/** Точки графика выручки: неделя 7 дней, месяц 30 дней, год 12 месяцев */
export function buildRevenueChartPoints(
  orders: Order[],
  period: PeriodKey,
  now: Date,
): ChartPoint[] {
  const range = getPeriodRange(period, now);

  if (period === "week" || period === "month") {
    const days = period === "week" ? 7 : 30;
    const points: ChartPoint[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const day = addAlmatyDays(startOfAlmatyDay(now), -i);
      const start = startOfAlmatyDay(day);
      const end = endOfAlmatyDay(day);
      const value = paidRevenueInRange(orders, start, end);
      points.push({
        key: almatyDayKey(day),
        label: formatDateShortRu(day),
        shortLabel: String(
          new Intl.DateTimeFormat("ru-RU", {
            timeZone: "Asia/Almaty",
            day: "numeric",
          }).format(day),
        ),
        value,
        start,
        end,
      });
    }
    return points;
  }

  const points: ChartPoint[] = [];
  const currentMonth = startOfAlmatyMonth(now);
  for (let i = 11; i >= 0; i -= 1) {
    const monthStart = startOfAlmatyMonth(addAlmatyMonths(currentMonth, -i));
    const nextMonth = startOfAlmatyMonth(addAlmatyMonths(monthStart, 1));
    const end = new Date(nextMonth.getTime() - 1);
    const clippedEnd = end.getTime() > range.end.getTime() ? range.end : end;
    const value = paidRevenueInRange(orders, monthStart, clippedEnd);
    points.push({
      key: almatyMonthKey(monthStart),
      label: formatMonthRu(monthStart),
      shortLabel: formatMonthRu(monthStart).replace(".", ""),
      value,
      start: monthStart,
      end: clippedEnd,
    });
  }
  return points;
}

/** Красивые округлённые деления оси Y */
export function niceTicks(maxValue: number, tickCount = 4): number[] {
  if (maxValue <= 0) {
    return [0, 1];
  }
  const rawStep = maxValue / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const residual = rawStep / magnitude;
  let niceResidual = 1;
  if (residual > 5) niceResidual = 10;
  else if (residual > 2.5) niceResidual = 5;
  else if (residual > 1) niceResidual = 2;
  const step = niceResidual * magnitude;
  const top = Math.ceil(maxValue / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 1000; v += step) {
    ticks.push(Math.round(v));
  }
  return ticks;
}

export function chartHasData(points: ChartPoint[]): boolean {
  return points.some((p) => p.value > 0);
}

export function chartAccessibleSummary(points: ChartPoint[]): string {
  if (!chartHasData(points)) {
    return "За выбранный период оплаченных заказов нет. График показывает нулевую линию.";
  }
  return points
    .map((p) => `${p.label}: ${formatTenge(p.value)}`)
    .join("; ");
}
