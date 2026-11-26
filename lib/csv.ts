import { toCsvDate } from "@/lib/format";
import type { Order } from "@/lib/types";

const CSV_HEADERS = [
  "ID",
  "Клиент",
  "Телефон",
  "Услуга",
  "Сумма (₸)",
  "Дата",
  "Статус",
  "Комментарий",
] as const;

/** Защита от CSV formula injection: ведущий апостроф для = + - @ */
export function protectCsvFormula(value: string): string {
  if (/^[=+\-@]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

/** Экранирование поля: кавычки, ; , перенос → обёртка в "" */
export function escapeCsvField(raw: string): string {
  const value = protectCsvFormula(raw);
  if (/[;"\r\n,]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Чистая функция: заказы → CSV-строка (UTF-8 текст без BOM) */
export function ordersToCsv(orders: Order[]): string {
  const lines: string[] = [];
  lines.push(CSV_HEADERS.map((h) => escapeCsvField(h)).join(";"));

  for (const order of orders) {
    const row = [
      order.id,
      order.clientName,
      order.phone,
      order.service,
      String(Math.round(order.amount)),
      toCsvDate(order.createdAt),
      order.status,
      order.comment,
    ].map((cell) => escapeCsvField(cell));
    lines.push(row.join(";"));
  }

  return `${lines.join("\r\n")}\r\n`;
}

/** Добавляет BOM и готовит Blob для скачивания в Excel */
export function csvToBlob(csvBody: string): Blob {
  const withBom = `\uFEFF${csvBody}`;
  return new Blob([withBom], { type: "text/csv;charset=utf-8;" });
}

export function downloadCsv(filename: string, csvBody: string): void {
  const blob = csvToBlob(csvBody);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
