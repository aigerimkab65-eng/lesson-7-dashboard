export type OrderStatus = "Новый" | "В работе" | "Оплачен" | "Отменён";

export type PeriodKey = "week" | "month" | "year";

export type StatusFilter = "all" | OrderStatus;

export interface ServiceItem {
  name: string;
  priceKzt: number;
  weight: number;
}

export interface Order {
  id: string;
  clientName: string;
  phone: string;
  service: string;
  amount: number;
  createdAt: string;
  status: OrderStatus;
  comment: string;
}

export interface PeriodRange {
  start: Date;
  end: Date;
  label: string;
  previousLabel: string;
}

export interface MetricChange {
  percent: number | null;
  direction: "up" | "down" | "flat" | "none";
}

export interface KpiCardData {
  key: "revenue" | "orders" | "avgCheck" | "leads";
  title: string;
  value: number;
  displayValue: string;
  change: MetricChange;
  changeLabel: string;
  comparisonCaption: string;
  hint: string;
}

export interface ChartPoint {
  key: string;
  label: string;
  shortLabel: string;
  value: number;
  start: Date;
  end: Date;
}

export type StatusOverrides = Record<string, OrderStatus>;
