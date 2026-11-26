"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Download, FilterX } from "lucide-react";
import { TABLE_VISIBLE_LIMIT } from "@/lib/constants";
import { downloadCsv, ordersToCsv } from "@/lib/csv";
import { formatDateRu, formatTenge, toFileDateStamp } from "@/lib/format";
import { countByStatus } from "@/lib/metrics";
import type { Order, OrderStatus, StatusFilter } from "@/lib/types";

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "Все" },
  { key: "Новый", label: "Новый" },
  { key: "В работе", label: "В работе" },
  { key: "Оплачен", label: "Оплачен" },
  { key: "Отменён", label: "Отменён" },
];

const ALL_STATUSES: OrderStatus[] = [
  "Новый",
  "В работе",
  "Оплачен",
  "Отменён",
];

function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "Новый":
      return "bg-[rgba(47,93,138,0.12)] text-info";
    case "В работе":
      return "bg-[rgba(138,106,47,0.14)] text-warning";
    case "Оплачен":
      return "bg-[rgba(31,107,74,0.12)] text-success";
    case "Отменён":
      return "bg-[rgba(180,35,24,0.1)] text-danger";
  }
}

interface OrdersTableProps {
  ordersInPeriod: Order[];
  now: Date;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onResetFilters: () => void;
}

export function OrdersTable({
  ordersInPeriod,
  now,
  onStatusChange,
  onResetFilters,
}: OrdersTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts = useMemo(
    () => countByStatus(ordersInPeriod),
    [ordersInPeriod],
  );

  const filtered = useMemo(() => {
    if (statusFilter === "all") {
      return ordersInPeriod;
    }
    return ordersInPeriod.filter((order) => order.status === statusFilter);
  }, [ordersInPeriod, statusFilter]);

  const visible = filtered.slice(0, TABLE_VISIBLE_LIMIT);

  function handleExport() {
    const csv = ordersToCsv(filtered);
    const filename = `studioboard-orders-${toFileDateStamp(now)}.csv`;
    downloadCsv(filename, csv);
  }

  return (
    <section className="card-enter min-w-0 overflow-x-clip rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow)] sm:p-6">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Заказы
          </h2>
          <p className="mt-1 text-sm text-muted">
            Последние {TABLE_VISIBLE_LIMIT} по текущим фильтрам. Экспорт берёт
            все подходящие строки.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-sm font-semibold text-accent-contrast transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden />
          Экспорт в CSV
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Фильтр по статусу"
        className="mt-5 flex flex-wrap gap-2"
      >
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.key;
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStatusFilter(tab.key)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-sm font-medium transition ${
                active
                  ? "border-accent bg-accent text-accent-contrast"
                  : "border-border bg-surface-soft text-muted hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active ? "bg-white/20" : "bg-surface text-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface-soft px-5 py-10 text-center">
          <p className="text-sm text-muted">
            По выбранным фильтрам заказов нет. Можно сбросить фильтры и посмотреть
            снова.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              onResetFilters();
            }}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
          >
            <FilterX className="h-4 w-4" aria-hidden />
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="relative mt-5 min-w-0 max-w-full overflow-x-clip">
          <p className="mb-2 text-xs text-muted md:hidden">
            Листайте таблицу вправо →
          </p>
          <div className="table-scroll max-w-full min-w-0 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-surface-soft text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Клиент</th>
                  <th className="px-4 py-3 font-semibold">Услуга</th>
                  <th className="px-4 py-3 font-semibold">Сумма</th>
                  <th className="px-4 py-3 font-semibold">Дата</th>
                  <th className="px-4 py-3 font-semibold">Статус</th>
                  <th className="px-4 py-3 font-semibold">
                    <span className="sr-only">Подробнее</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => {
                  const open = expandedId === order.id;
                  return (
                    <FragmentRow
                      key={order.id}
                      order={order}
                      open={open}
                      onToggle={() =>
                        setExpandedId((prev) =>
                          prev === order.id ? null : order.id,
                        )
                      }
                      onStatusChange={onStatusChange}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
          <div
            className="table-scroll-hint pointer-events-none absolute inset-y-8 right-0 w-10 rounded-r-2xl md:hidden"
            aria-hidden
          />
          {filtered.length > TABLE_VISIBLE_LIMIT ? (
            <p className="mt-3 text-xs text-muted">
              Показаны {TABLE_VISIBLE_LIMIT} из {filtered.length}. В CSV попадут
              все {filtered.length}.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function FragmentRow({
  order,
  open,
  onToggle,
  onStatusChange,
}: {
  order: Order;
  open: boolean;
  onToggle: () => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}) {
  return (
    <>
      <tr className="border-t border-border align-middle">
        <td className="px-4 py-3 font-medium text-foreground">{order.id}</td>
        <td className="max-w-[180px] px-4 py-3">
          <span className="break-anywhere">{order.clientName}</span>
        </td>
        <td className="max-w-[200px] px-4 py-3 text-muted">
          <span className="break-anywhere">{order.service}</span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-medium">
          {formatTenge(order.amount)}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-muted">
          {formatDateRu(order.createdAt)}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-2">
            <span
              className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(order.status)}`}
            >
              {order.status}
            </span>
            <label className="sr-only" htmlFor={`status-${order.id}`}>
              Изменить статус заказа {order.id}
            </label>
            <select
              id={`status-${order.id}`}
              value={order.status}
              onChange={(event) =>
                onStatusChange(order.id, event.target.value as OrderStatus)
              }
              className="min-h-11 rounded-xl border border-border bg-surface px-2 text-sm text-foreground"
            >
              {ALL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </td>
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border text-muted transition hover:text-foreground"
            aria-expanded={open}
            aria-controls={`details-${order.id}`}
            aria-label={
              open
                ? `Скрыть детали заказа ${order.id}`
                : `Показать телефон и комментарий заказа ${order.id}`
            }
          >
            {open ? (
              <ChevronUp className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden />
            )}
          </button>
        </td>
      </tr>
      {open ? (
        <tr className="border-t border-border bg-surface-soft/70">
          <td colSpan={7} id={`details-${order.id}`} className="px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                  Телефон
                </p>
                <p className="mt-1 text-sm text-foreground">{order.phone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                  Комментарий
                </p>
                <p className="mt-1 whitespace-pre-wrap break-anywhere text-sm text-foreground">
                  {order.comment || "Без комментария"}
                </p>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
