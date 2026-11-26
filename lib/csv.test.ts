import { describe, expect, it } from "vitest";
import {
  escapeCsvField,
  ordersToCsv,
  protectCsvFormula,
} from "@/lib/csv";
import type { Order } from "@/lib/types";

const sample: Order = {
  id: "ORD-0001",
  clientName: 'ТОО "Студия, Алматы"',
  phone: "+7 700 000 00 12",
  service: "Инфографика",
  amount: 9880,
  createdAt: "2024-06-15T10:00:00.000Z",
  status: "Оплачен",
  comment: "Строка 1\nСтрока 2",
};

describe("protectCsvFormula", () => {
  it("ставит апостроф перед опасными символами", () => {
    expect(protectCsvFormula("=1+1")).toBe("'=1+1");
    expect(protectCsvFormula("+hack")).toBe("'+hack");
    expect(protectCsvFormula("-1")).toBe("'-1");
    expect(protectCsvFormula("@cmd")).toBe("'@cmd");
    expect(protectCsvFormula("Обычный")).toBe("Обычный");
  });
});

describe("escapeCsvField", () => {
  it("экранирует ; кавычки и переносы", () => {
    expect(escapeCsvField('a;b')).toBe('"a;b"');
    expect(escapeCsvField('скажи "привет"')).toBe('"скажи ""привет"""');
    expect(escapeCsvField("a\nb")).toBe('"a\nb"');
  });
});

describe("ordersToCsv", () => {
  it("собирает строки с ; и CRLF", () => {
    const csv = ordersToCsv([
      sample,
      {
        ...sample,
        id: "ORD-0002",
        clientName: "=Формула",
        amount: 1000,
        comment: "ок;да",
      },
      {
        ...sample,
        id: "ORD-0003",
        clientName: "-Скидка",
        phone: "+7 700 000 00 99",
        amount: 2000,
        comment: "a\nb",
      },
    ]);

    expect(csv.startsWith("ID;Клиент;Телефон;")).toBe(true);
    expect(csv.includes("\r\n")).toBe(true);
    expect(csv).toContain("'=Формула");
    expect(csv).toContain("'-Скидка");
    expect(csv).toContain("9880");
    expect(csv).not.toContain("9880 ₸");
    expect(csv).toContain("15.06.2024");
    expect(csv).toContain('"ТОО ""Студия, Алматы"""');
    expect(csv).toContain('"a\nb"');
  });
});
