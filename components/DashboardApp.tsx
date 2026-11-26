"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { KpiCards } from "@/components/KpiCards";
import { OrdersTable } from "@/components/OrdersTable";
import { PeriodTabs } from "@/components/PeriodTabs";
import { RevenueChart } from "@/components/RevenueChart";
import { applyStatusOverrides, generateDemoOrders } from "@/lib/demoOrders";
import { filterOrdersByPeriod, computeKpis } from "@/lib/metrics";
import {
  clearStatusOverrides,
  loadStatusOverrides,
  saveStatusOverrides,
} from "@/lib/statusStorage";
import type { OrderStatus, PeriodKey, StatusOverrides } from "@/lib/types";

export function DashboardApp() {
  const [now, setNow] = useState<Date | null>(null);
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [overrides, setOverrides] = useState<StatusOverrides>({});
  const [tableResetKey, setTableResetKey] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Отложенно: так гидрация совпадает с SSR, и lint не ругается на sync setState.
    queueMicrotask(() => {
      if (cancelled) return;
      setNow(new Date());
      setOverrides(loadStatusOverrides());
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const baseOrders = useMemo(
    () => (now ? generateDemoOrders(now) : []),
    [now],
  );

  const orders = useMemo(
    () => applyStatusOverrides(baseOrders, overrides),
    [baseOrders, overrides],
  );

  const kpis = useMemo(
    () => (now ? computeKpis(orders, period, now) : []),
    [orders, period, now],
  );

  const ordersInPeriod = useMemo(
    () => (now ? filterOrdersByPeriod(orders, period, now) : []),
    [orders, period, now],
  );

  function handleStatusChange(orderId: string, status: OrderStatus) {
    setOverrides((prev) => {
      const base = baseOrders.find((o) => o.id === orderId);
      const next = { ...prev };
      if (base && base.status === status) {
        delete next[orderId];
      } else {
        next[orderId] = status;
      }
      saveStatusOverrides(next);
      return next;
    });
  }

  function handleResetDemo() {
    clearStatusOverrides();
    setOverrides({});
    setPeriod("month");
    setTableResetKey((key) => key + 1);
    setNow(new Date());
  }

  function handleResetFilters() {
    setPeriod("month");
    setTableResetKey((key) => key + 1);
  }

  if (!ready || !now) {
    return (
      <main className="mx-auto min-h-screen w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="h-40 animate-pulse rounded-[28px] bg-surface/70" />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-[24px] bg-surface/70"
            />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full min-w-0 max-w-7xl flex-col gap-6 overflow-x-clip px-4 py-8 sm:px-6 sm:py-10">
      <DashboardHeader onResetDemo={handleResetDemo} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Период сразу меняет карточки, график и таблицу
        </p>
        <PeriodTabs
          value={period}
          onChange={setPeriod}
          label="Период метрик, графика и таблицы"
        />
      </div>

      <KpiCards cards={kpis} />
      <RevenueChart
        orders={orders}
        period={period}
        now={now}
        onPeriodChange={setPeriod}
      />
      <OrdersTable
        key={tableResetKey}
        ordersInPeriod={ordersInPeriod}
        now={now}
        onStatusChange={handleStatusChange}
        onResetFilters={handleResetFilters}
      />
      <footer className="pb-4 text-center text-xs text-muted">
        StudioBoard · демо-панель студии Aigerim Kabaeva
      </footer>
    </main>
  );
}
