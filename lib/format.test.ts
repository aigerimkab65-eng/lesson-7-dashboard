import { describe, expect, it } from "vitest";
import {
  formatPercentChange,
  formatTenge,
  formatTengeShort,
  toCsvDate,
  toFileDateStamp,
} from "@/lib/format";

describe("formatTenge", () => {
  it("форматирует с пробелами и знаком тенге", () => {
    const text = formatTenge(1234567);
    expect(text.endsWith(" ₸")).toBe(true);
    expect(text.replace(/\s/g, "")).toBe("1234567₸");
  });
});

describe("formatPercentChange", () => {
  it("показывает плюс и минус", () => {
    expect(formatPercentChange(14.2)).toBe("+14%");
    expect(formatPercentChange(-3.1)).toBe("-3%");
  });

  it("для null показывает тире", () => {
    expect(formatPercentChange(null)).toBe("—");
  });
});

describe("formatTengeShort", () => {
  it("сокращает тысячи и миллионы", () => {
    expect(formatTengeShort(120_000)).toContain("тыс");
    expect(formatTengeShort(1_200_000)).toContain("млн");
  });
});

describe("dates", () => {
  it("дата CSV в формате DD.MM.YYYY по Алматы", () => {
    // 2024-06-15 12:00 UTC = 17:00 Алматы
    expect(toCsvDate(new Date("2024-06-15T12:00:00.000Z"))).toBe("15.06.2024");
  });

  it("штамп файла YYYY-MM-DD", () => {
    expect(toFileDateStamp(new Date("2024-06-15T12:00:00.000Z"))).toBe(
      "2024-06-15",
    );
  });
});
