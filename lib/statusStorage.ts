import { ORDERS_STATUS_STORAGE_KEY } from "@/lib/constants";
import type { OrderStatus, StatusOverrides } from "@/lib/types";

const VALID_STATUSES: OrderStatus[] = [
  "Новый",
  "В работе",
  "Оплачен",
  "Отменён",
];

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && VALID_STATUSES.includes(value as OrderStatus);
}

export function loadStatusOverrides(): StatusOverrides {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(ORDERS_STATUS_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    const result: StatusOverrides = {};
    for (const [id, status] of Object.entries(parsed)) {
      if (isOrderStatus(status)) {
        result[id] = status;
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function saveStatusOverrides(overrides: StatusOverrides): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    window.localStorage.setItem(
      ORDERS_STATUS_STORAGE_KEY,
      JSON.stringify(overrides),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearStatusOverrides(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    window.localStorage.removeItem(ORDERS_STATUS_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
