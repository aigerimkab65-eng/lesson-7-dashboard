import { describe, expect, it } from "vitest";
import { generateDemoOrders } from "@/lib/demoOrders";
import {
  calcAvgCheck,
  calcChange,
  calcNewLeads,
  calcOrderCount,
  calcRevenue,
  computeKpis,
  filterOrdersByPeriod,
} from "@/lib/metrics";
import { buildRevenueChartPoints } from "@/lib/chart";
import type { Order } from "@/lib/types";

const NOW = new Date("2025-11-25T12:00:00.000Z");

function order(
  partial: Partial<Order> & Pick<Order, "id" | "amount" | "createdAt" | "status">,
): Order {
  return {
    clientName: "Тест",
    phone: "+7 700 000 00 01",
    service: "Инфографика",
    comment: "",
    ...partial,
  };
}

describe("calcChange", () => {
  it("не делит на ноль", () => {
    expect(calcChange(10, 0)).toEqual({ percent: null, direction: "none" });
  });

  it("считает рост и падение", () => {
    expect(calcChange(114, 100).percent).toBeCloseTo(14);
    expect(calcChange(114, 100).direction).toBe("up");
    expect(calcChange(80, 100).direction).toBe("down");
  });
});

describe("KPI helpers", () => {
  const sample: Order[] = [
    order({
      id: "1",
      amount: 1000,
      createdAt: "2025-11-24T10:00:00.000Z",
      status: "Оплачен",
    }),
    order({
      id: "2",
      amount: 2000,
      createdAt: "2025-11-24T11:00:00.000Z",
      status: "Оплачен",
    }),
    order({
      id: "3",
      amount: 5000,
      createdAt: "2025-11-24T12:00:00.000Z",
      status: "Новый",
    }),
    order({
      id: "4",
      amount: 9000,
      createdAt: "2025-11-24T13:00:00.000Z",
      status: "Отменён",
    }),
  ];

  it("выручка только из оплаченных", () => {
    expect(calcRevenue(sample)).toBe(3000);
  });

  it("число заказов без отменённых", () => {
    expect(calcOrderCount(sample)).toBe(3);
  });

  it("средний чек округляется, без оплаченных = 0", () => {
    expect(calcAvgCheck(sample)).toBe(1500);
    expect(calcAvgCheck([])).toBe(0);
  });

  it("новые лиды", () => {
    expect(calcNewLeads(sample)).toBe(1);
  });
});

describe("computeKpis + demo data", () => {
  it("демо-данные стабильны и есть в каждом периоде", () => {
    const a = generateDemoOrders(NOW);
    const b = generateDemoOrders(NOW);
    expect(a).toHaveLength(150);
    expect(a.map((o) => o.id)).toEqual(b.map((o) => o.id));

    for (const period of ["week", "month", "year"] as const) {
      const filtered = filterOrdersByPeriod(a, period, NOW);
      expect(filtered.length).toBeGreaterThan(0);
      const kpis = computeKpis(a, period, NOW);
      expect(kpis).toHaveLength(4);
      expect(kpis.every((k) => k.changeLabel !== "NaN%")).toBe(true);
      const points = buildRevenueChartPoints(a, period, NOW);
      expect(points.length).toBe(period === "year" ? 12 : period === "week" ? 7 : 30);
    }
  });

  it("средний чек показывается как — если нет оплаченных", () => {
    const unpaid: Order[] = [
      order({
        id: "n1",
        amount: 1000,
        createdAt: "2025-11-25T08:00:00.000Z",
        status: "Новый",
      }),
    ];
    const kpis = computeKpis(unpaid, "week", NOW);
    const avg = kpis.find((k) => k.key === "avgCheck");
    expect(avg?.displayValue).toBe("—");
  });
});
