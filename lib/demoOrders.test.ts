import { describe, expect, it } from "vitest";
import { applyStatusOverrides, generateDemoOrders } from "@/lib/demoOrders";
import { SERVICES } from "@/lib/services";
import { filterOrdersByPeriod } from "@/lib/metrics";
import { ordersToCsv } from "@/lib/csv";

const NOW = new Date("2025-11-25T12:00:00.000Z");

describe("generateDemoOrders", () => {
  it("даёт 150 заказов и стабильный результат", () => {
    const a = generateDemoOrders(NOW);
    const b = generateDemoOrders(NOW);
    expect(a).toHaveLength(150);
    expect(a).toEqual(b);
    expect(a[0].id).toMatch(/^ORD-\d{4}$/);
  });

  it("есть заказы во всех периодах", () => {
    const orders = generateDemoOrders(NOW);
    expect(filterOrdersByPeriod(orders, "week", NOW).length).toBeGreaterThan(0);
    expect(filterOrdersByPeriod(orders, "month", NOW).length).toBeGreaterThan(0);
    expect(filterOrdersByPeriod(orders, "year", NOW).length).toBeGreaterThan(0);
  });

  it("содержит спец-клиентов для CSV", () => {
    const orders = generateDemoOrders(NOW);
    const names = orders.map((o) => o.clientName);
    expect(names.some((n) => n.includes(","))).toBe(true);
    expect(names.some((n) => n.startsWith("="))).toBe(true);
    expect(names.some((n) => n.startsWith("+"))).toBe(true);
    expect(names.some((n) => n.startsWith("-"))).toBe(true);
    expect(names.some((n) => /[әғқңөұүһі]/i.test(n))).toBe(true);
    expect(names.some((n) => n.length > 60)).toBe(true);
    expect(orders.some((o) => o.comment.includes("\n"))).toBe(true);
    expect(orders.some((o) => o.comment.includes(";") || o.clientName.includes(";"))).toBe(
      true,
    );
  });

  it("суммы кратны прайсу с учётом 1–3 и срочности +30%", () => {
    const prices = new Set(SERVICES.map((s) => s.priceKzt));
    const orders = generateDemoOrders(NOW);
    for (const order of orders) {
      const service = SERVICES.find((s) => s.name === order.service);
      expect(service).toBeTruthy();
      const base = service!.priceKzt;
      const ok = [1, 2, 3].some((qty) => {
        const plain = Math.round(base * qty);
        const urgent = Math.round(base * qty * 1.3);
        return order.amount === plain || order.amount === urgent;
      });
      expect(ok).toBe(true);
      expect(prices.has(base)).toBe(true);
    }
  });

  it("applyStatusOverrides меняет статус по id", () => {
    const orders = generateDemoOrders(NOW);
    const id = orders[0].id;
    const next = applyStatusOverrides(orders, { [id]: "Отменён" });
    expect(next.find((o) => o.id === id)?.status).toBe("Отменён");
  });

  it("CSV спец-полей экранируется и защищается", () => {
    const orders = generateDemoOrders(NOW);
    const csv = ordersToCsv(orders);
    expect(csv).toContain("'=");
    expect(csv).toContain("'+");
    expect(csv).toContain("'-");
    expect(csv.includes("\r\n")).toBe(true);
  });
});
