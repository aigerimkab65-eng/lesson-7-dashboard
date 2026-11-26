"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatTenge, formatTengeShort } from "@/lib/format";
import {
  buildRevenueChartPoints,
  chartAccessibleSummary,
  chartHasData,
  niceTicks,
} from "@/lib/chart";
import type { Order, PeriodKey } from "@/lib/types";
import { PeriodTabs } from "@/components/PeriodTabs";

interface RevenueChartProps {
  orders: Order[];
  period: PeriodKey;
  now: Date;
  onPeriodChange: (period: PeriodKey) => void;
}

const WIDTH = 640;
const HEIGHT = 280;
const PAD = { top: 20, right: 18, bottom: 44, left: 56 };

function shouldShowLabel(
  index: number,
  total: number,
  period: PeriodKey,
): boolean {
  if (index === 0 || index === total - 1) return true;
  if (period === "week") return index % 2 === 0;
  if (period === "month") return index % 5 === 0;
  return index % 2 === 0;
}

export function RevenueChart({
  orders,
  period,
  now,
  onPeriodChange,
}: RevenueChartProps) {
  const points = useMemo(
    () => buildRevenueChartPoints(orders, period, now),
    [orders, period, now],
  );
  const hasData = chartHasData(points);
  const ticks = useMemo(
    () => niceTicks(Math.max(...points.map((p) => p.value), 0)),
    [points],
  );
  const maxY = ticks[ticks.length - 1] || 1;
  const summary = chartAccessibleSummary(points);
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  /** Радиус невидимой зоны в user units: на экране всегда ≥ 48px */
  const [hitRadius, setHitRadius] = useState(24);
  /** На таче tooltip должен оставаться после tap; mouseLeave его не гасит */
  const stickyTooltip = useRef(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function updateHitRadius() {
      const el = svgRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      const scale = rect.width / WIDTH;
      // 2 * r * scale ≥ 48 → r ≥ 24 / scale; минимум 24 (пример из ТЗ)
      setHitRadius(Math.max(24, 24 / scale));
    }

    updateHitRadius();
    const observer = new ResizeObserver(updateHitRadius);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  function handlePeriodChange(next: PeriodKey) {
    stickyTooltip.current = false;
    setActiveIndex(null);
    onPeriodChange(next);
  }

  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;

  const coords = points.map((point, index) => {
    const x =
      points.length === 1
        ? PAD.left + innerW / 2
        : PAD.left + (index / (points.length - 1)) * innerW;
    const y = PAD.top + innerH - (point.value / maxY) * innerH;
    return { x, y, point };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(" ");

  const areaPath = hasData
    ? `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${(PAD.top + innerH).toFixed(2)} L ${coords[0].x.toFixed(2)} ${(PAD.top + innerH).toFixed(2)} Z`
    : "";

  const active = activeIndex !== null ? coords[activeIndex] : null;

  return (
    <section className="card-enter min-w-0 rounded-[28px] border border-border bg-surface p-5 shadow-[var(--shadow)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Динамика выручки
          </h2>
          <p className="mt-1 text-sm text-muted">
            Только заказы со статусом «Оплачен»
          </p>
        </div>
        <PeriodTabs
          value={period}
          onChange={handlePeriodChange}
          label="Период графика"
        />
      </div>

      {!hasData ? (
        <p className="mt-4 rounded-2xl bg-surface-soft px-4 py-3 text-sm text-muted">
          За этот период оплаченных заказов пока нет. Показана спокойная нулевая
          линия.
        </p>
      ) : null}

      <div className="relative mt-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label={summary}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f766e" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => {
            const y = PAD.top + innerH - (tick / maxY) * innerH;
            return (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={WIDTH - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(20,32,28,0.08)"
                />
                <text
                  x={PAD.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted"
                  fontSize="10"
                >
                  {formatTengeShort(tick)}
                </text>
              </g>
            );
          })}

          {areaPath ? (
            <path d={areaPath} fill={`url(#${gradientId})`} />
          ) : null}
          <path
            d={linePath}
            fill="none"
            stroke="#0f766e"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {coords.map((c, index) => {
            const showLabel = shouldShowLabel(index, coords.length, period);
            const axisLabel =
              period === "year"
                ? c.point.shortLabel
                : period === "month"
                  ? c.point.shortLabel
                  : c.point.shortLabel;

            return (
              <g key={c.point.key}>
                {/* Невидимая зона ≥48×48 CSS px для тапа/фокуса */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={hitRadius}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`${c.point.label}: ${formatTenge(c.point.value)}`}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") {
                      stickyTooltip.current = false;
                      setActiveIndex(index);
                    }
                  }}
                  onPointerLeave={(event) => {
                    if (
                      event.pointerType === "mouse" &&
                      !stickyTooltip.current
                    ) {
                      setActiveIndex(null);
                    }
                  }}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => {
                    if (!stickyTooltip.current) {
                      setActiveIndex(null);
                    }
                  }}
                  onClick={() => {
                    stickyTooltip.current = true;
                    setActiveIndex((prev) => (prev === index ? null : index));
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      stickyTooltip.current = true;
                      setActiveIndex((prev) =>
                        prev === index ? null : index,
                      );
                    }
                  }}
                  className="cursor-pointer outline-none focus-visible:stroke-accent"
                />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={activeIndex === index ? 5 : 3.5}
                  fill="#0f766e"
                  pointerEvents="none"
                />
                {showLabel ? (
                  <text
                    x={c.x}
                    y={HEIGHT - 14}
                    textAnchor="middle"
                    className="fill-muted"
                    fontSize="10"
                  >
                    {axisLabel}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>

        {active ? (
          <div
            className="pointer-events-none absolute z-10 rounded-xl border border-border bg-foreground px-3 py-2 text-xs text-accent-contrast shadow-lg"
            style={{
              left: `min(max(${(active.x / WIDTH) * 100}% - 70px, 4px), calc(100% - 150px))`,
              top: `max(8px, calc(${(active.y / HEIGHT) * 100}% - 56px))`,
            }}
          >
            <p className="font-medium">{active.point.label}</p>
            <p>{formatTenge(active.point.value)}</p>
          </div>
        ) : null}
      </div>

      <table className="sr-only">
        <caption>Сводка выручки по точкам графика</caption>
        <thead>
          <tr>
            <th>Период</th>
            <th>Выручка</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.key}>
              <td>{point.label}</td>
              <td>{formatTenge(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
