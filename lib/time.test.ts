import { describe, expect, it } from "vitest";
import {
  addAlmatyDays,
  almatyDayKey,
  endOfAlmatyDay,
  getPeriodRange,
  getPreviousPeriodRange,
  isInRange,
  startOfAlmatyDay,
} from "@/lib/time";

const NOW = new Date("2025-11-25T09:30:00.000Z"); // 14:30 Алматы

describe("Asia/Almaty day bounds", () => {
  it("startOfAlmatyDay = 00:00 в Алматы", () => {
    const start = startOfAlmatyDay(NOW);
    expect(almatyDayKey(start)).toBe("2025-11-25");
    // 00:00 Алматы = 19:00 UTC предыдущего дня
    expect(start.toISOString()).toBe("2025-11-24T19:00:00.000Z");
  });

  it("endOfAlmatyDay почти следующий день", () => {
    const end = endOfAlmatyDay(NOW);
    expect(end.getTime()).toBe(startOfAlmatyDay(NOW).getTime() + 86400000 - 1);
  });
});

describe("period ranges", () => {
  it("неделя = 7 календарных дней включая сегодня", () => {
    const range = getPeriodRange("week", NOW);
    const prev = getPreviousPeriodRange("week", NOW);
    expect(almatyDayKey(range.start)).toBe("2025-11-19");
    expect(almatyDayKey(range.end)).toBe("2025-11-25");
    expect(almatyDayKey(prev.start)).toBe("2025-11-12");
    expect(almatyDayKey(prev.end)).toBe("2025-11-18");
  });

  it("месяц = 30 дней, предыдущий такой же длины", () => {
    const range = getPeriodRange("month", NOW);
    const prev = getPreviousPeriodRange("month", NOW);
    expect(almatyDayKey(range.start)).toBe("2025-10-27");
    expect(almatyDayKey(prev.end)).toBe("2025-10-26");
    expect(almatyDayKey(prev.start)).toBe("2025-09-27");
  });

  it("год = 12 месяцев с начала текущего-11", () => {
    const range = getPeriodRange("year", NOW);
    expect(almatyDayKey(range.start)).toBe("2024-12-01");
  });

  it("isInRange включает границы", () => {
    const start = startOfAlmatyDay(NOW);
    const end = endOfAlmatyDay(NOW);
    expect(isInRange(start, start, end)).toBe(true);
    expect(isInRange(end, start, end)).toBe(true);
    expect(isInRange(addAlmatyDays(start, -1), start, end)).toBe(false);
  });
});
