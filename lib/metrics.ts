import { formatPercentChange, formatTenge } from "@/lib/format";
import {
  getPeriodRange,
  getPreviousPeriodRange,
  isInRange,
} from "@/lib/time";
import type {
  KpiCardData,
  MetricChange,
  Order,
  PeriodKey,
} from "@/lib/types";

function inPeriod(orders: Order[], start: Date, end: Date): Order[] {
  return orders.filter((order) => isInRange(order.createdAt, start, end));
}

export function calcRevenue(orders: Order[]): number {
  return orders
    .filter((o) => o.status === "Оплачен")
    .reduce((sum, o) => sum + o.amount, 0);
}

export function calcOrderCount(orders: Order[]): number {
  return orders.filter((o) => o.status !== "Отменён").length;
}

export function calcAvgCheck(orders: Order[]): number {
  const paid = orders.filter((o) => o.status === "Оплачен");
  if (paid.length === 0) {
    return 0;
  }
  return Math.round(calcRevenue(paid) / paid.length);
}

export function calcNewLeads(orders: Order[]): number {
  return orders.filter((o) => o.status === "Новый").length;
}

export function calcChange(current: number, previous: number): MetricChange {
  if (previous === 0) {
    return { percent: null, direction: "none" };
  }
  const percent = ((current - previous) / previous) * 100;
  if (!Number.isFinite(percent)) {
    return { percent: null, direction: "none" };
  }
  if (percent > 0) {
    return { percent, direction: "up" };
  }
  if (percent < 0) {
    return { percent, direction: "down" };
  }
  return { percent: 0, direction: "flat" };
}

function formatMetricValue(
  key: KpiCardData["key"],
  value: number,
): string {
  if (key === "revenue") {
    return formatTenge(value);
  }
  if (key === "avgCheck") {
    return value === 0 ? "—" : formatTenge(value);
  }
  return new Intl.NumberFormat("ru-RU").format(value);
}

/**
 * Четыре KPI за период + сравнение с предыдущим таким же отрезком.
 * Все даты считаются через Asia/Almaty (внутри getPeriodRange).
 */
export function computeKpis(
  orders: Order[],
  period: PeriodKey,
  now: Date,
): KpiCardData[] {
  const currentRange = getPeriodRange(period, now);
  const previousRange = getPreviousPeriodRange(period, now);

  const currentOrders = inPeriod(orders, currentRange.start, currentRange.end);
  const previousOrders = inPeriod(
    orders,
    previousRange.start,
    previousRange.end,
  );

  const specs: Array<{
    key: KpiCardData["key"];
    title: string;
    current: number;
    previous: number;
    hint: string;
  }> = [
    {
      key: "revenue",
      title: "Выручка",
      current: calcRevenue(currentOrders),
      previous: calcRevenue(previousOrders),
      hint: "Сумма заказов со статусом «Оплачен» за выбранный период.",
    },
    {
      key: "orders",
      title: "Число заказов",
      current: calcOrderCount(currentOrders),
      previous: calcOrderCount(previousOrders),
      hint: "Все заказы периода, кроме статуса «Отменён».",
    },
    {
      key: "avgCheck",
      title: "Средний чек",
      current: calcAvgCheck(currentOrders),
      previous: calcAvgCheck(previousOrders),
      hint: "Выручка, делённая на число оплаченных заказов (до целого).",
    },
    {
      key: "leads",
      title: "Новые лиды",
      current: calcNewLeads(currentOrders),
      previous: calcNewLeads(previousOrders),
      hint: "Заказы со статусом «Новый» за выбранный период.",
    },
  ];

  return specs.map((spec) => {
    const change = calcChange(spec.current, spec.previous);
    return {
      key: spec.key,
      title: spec.title,
      value: spec.current,
      displayValue: formatMetricValue(spec.key, spec.current),
      change,
      changeLabel: formatPercentChange(change.percent),
      comparisonCaption: currentRange.previousLabel,
      hint: spec.hint,
    };
  });
}

export function filterOrdersByPeriod(
  orders: Order[],
  period: PeriodKey,
  now: Date,
): Order[] {
  const range = getPeriodRange(period, now);
  return inPeriod(orders, range.start, range.end);
}

export function countByStatus(orders: Order[]): Record<string, number> {
  const counts: Record<string, number> = {
    all: orders.length,
    Новый: 0,
    "В работе": 0,
    Оплачен: 0,
    Отменён: 0,
  };
  for (const order of orders) {
    counts[order.status] = (counts[order.status] ?? 0) + 1;
  }
  return counts;
}
