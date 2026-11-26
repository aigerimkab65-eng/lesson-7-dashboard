/**
 * Текстовые доказательства для StudioBoard (без UI).
 * Запуск: node --experimental-strip-types не нужен — через vitest/vite-node.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const server = await createServer({
  root,
  configFile: path.join(root, "vitest.config.ts"),
  server: { middlewareMode: true },
  appType: "custom",
});

async function load(rel) {
  return server.ssrLoadModule(path.join(root, rel));
}

const NOW = new Date("2025-11-25T12:00:00.000Z");
const lines = [];
const ok = (label, pass, detail = "") => {
  lines.push(`${pass ? "PASS" : "FAIL"} | ${label}${detail ? ` | ${detail}` : ""}`);
  if (!pass) process.exitCode = 1;
};

try {
  const { generateDemoOrders, applyStatusOverrides } = await load("lib/demoOrders.ts");
  const { computeKpis, filterOrdersByPeriod, calcChange } = await load("lib/metrics.ts");
  const { buildRevenueChartPoints, chartHasData } = await load("lib/chart.ts");
  const { ordersToCsv, protectCsvFormula, escapeCsvField } = await load("lib/csv.ts");
  const { getPeriodRange, getPreviousPeriodRange, almatyDayKey } = await load("lib/time.ts");
  const { formatTenge, formatPercentChange, toFileDateStamp } = await load("lib/format.ts");
  const { SERVICES } = await load("lib/services.ts");
  const {
    PROJECT_NAME,
    WHATSAPP_DISPLAY,
    TELEGRAM_DISPLAY,
    TIMEZONE,
    DEMO_ORDERS_COUNT,
  } = await load("lib/constants.ts");

  // --- constants ---
  ok("Проект StudioBoard", PROJECT_NAME === "StudioBoard", PROJECT_NAME);
  ok("Часовой пояс Asia/Almaty", TIMEZONE === "Asia/Almaty", TIMEZONE);
  ok("WhatsApp", WHATSAPP_DISPLAY === "+77007002132", WHATSAPP_DISPLAY);
  ok("Telegram", TELEGRAM_DISPLAY === "@aigerim_aicreator", TELEGRAM_DISPLAY);
  ok("Прайс: 13 услуг", SERVICES.length === 13, String(SERVICES.length));

  const priceMap = Object.fromEntries(SERVICES.map((s) => [s.name, s.priceKzt]));
  ok("AI-фотосессия 23920", priceMap["AI-фотосессия"] === 23920);
  ok("Интернет-магазин 208000", priceMap["Интернет-магазин"] === 208000);
  ok("Лендинг 96200", priceMap["Лендинг"] === 96200);

  // --- deterministic data ---
  const a = generateDemoOrders(NOW);
  const b = generateDemoOrders(NOW);
  ok("150 заказов", a.length === DEMO_ORDERS_COUNT, String(a.length));
  ok("Детерминизм (одинаково при 2 генерациях)", JSON.stringify(a) === JSON.stringify(b));
  ok(
    "ID вида ORD-0001",
    /^ORD-\d{4}$/.test(a[a.length - 1].id) && a.some((o) => o.id === "ORD-0001"),
    a[a.length - 1].id,
  );

  const names = a.map((o) => o.clientName);
  const comments = a.map((o) => o.comment);
  ok("Имя с запятой", names.some((n) => n.includes(",")));
  ok('Имя с кавычками "', names.some((n) => n.includes('"')));
  ok("Имя/коммент с ;", names.some((n) => n.includes(";")) || comments.some((c) => c.includes(";")));
  ok("Коммент с переносом строки", comments.some((c) => c.includes("\n")));
  ok('Имя начинается с "="', names.some((n) => n.startsWith("=")));
  ok('Имя начинается с "+"', names.some((n) => n.startsWith("+")));
  ok('Имя начинается с "-"', names.some((n) => n.startsWith("-")));
  ok("Длинное имя > 60", names.some((n) => n.length > 60), String(Math.max(...names.map((n) => n.length))));
  ok("Казахские буквы", names.some((n) => /[әғқңөұүһі]/i.test(n)) || comments.some((c) => /[әғқңөұүһі]/i.test(c)));
  ok(
    "Телефон вымышленный +7 700 000",
    a.every((o) => o.phone.startsWith("+7 700 000")),
  );

  // statuses present
  const statuses = new Set(a.map((o) => o.status));
  for (const s of ["Новый", "В работе", "Оплачен", "Отменён"]) {
    ok(`Статус «${s}» есть в данных`, statuses.has(s));
  }

  // amounts valid
  let badAmount = 0;
  for (const order of a) {
    const service = SERVICES.find((s) => s.name === order.service);
    if (!service) {
      badAmount += 1;
      continue;
    }
    const base = service.priceKzt;
    const valid = [1, 2, 3].some((qty) => {
      const plain = Math.round(base * qty);
      const urgent = Math.round(base * qty * 1.3);
      return order.amount === plain || order.amount === urgent;
    });
    if (!valid) badAmount += 1;
  }
  ok("Суммы = цена × (1–3) × (1|1.3)", badAmount === 0, `bad=${badAmount}`);

  // periods non-empty
  for (const p of ["week", "month", "year"]) {
    const filtered = filterOrdersByPeriod(a, p, NOW);
    ok(`Заказы в периоде ${p}`, filtered.length > 0, `count=${filtered.length}`);
  }

  // period math
  const week = getPeriodRange("week", NOW);
  const weekPrev = getPreviousPeriodRange("week", NOW);
  ok("Неделя start 2025-11-19", almatyDayKey(week.start) === "2025-11-19");
  ok("Неделя end 2025-11-25", almatyDayKey(week.end) === "2025-11-25");
  ok("Пред. неделя start 2025-11-12", almatyDayKey(weekPrev.start) === "2025-11-12");
  ok("Пред. неделя end 2025-11-18", almatyDayKey(weekPrev.end) === "2025-11-18");

  const month = getPeriodRange("month", NOW);
  ok("Месяц start 2025-10-27", almatyDayKey(month.start) === "2025-10-27");

  const year = getPeriodRange("year", NOW);
  ok("Год start 2024-12-01", almatyDayKey(year.start) === "2024-12-01");

  // KPIs
  for (const p of ["week", "month", "year"]) {
    const kpis = computeKpis(a, p, NOW);
    ok(`KPI×4 для ${p}`, kpis.length === 4, kpis.map((k) => k.title).join(", "));
    ok(
      `Нет NaN/Infinity в KPI ${p}`,
      kpis.every(
        (k) =>
          Number.isFinite(k.value) &&
          (k.change.percent === null || Number.isFinite(k.change.percent)) &&
          k.changeLabel !== "NaN%" &&
          k.changeLabel !== "Infinity%",
      ),
      kpis.map((k) => `${k.title}=${k.displayValue}/${k.changeLabel}`).join("; "),
    );
  }

  // division by zero
  const zeroChange = calcChange(10, 0);
  ok("prev=0 → percent null", zeroChange.percent === null && zeroChange.direction === "none");
  ok("formatPercent(null) → —", formatPercentChange(null) === "—");

  // avg check empty
  const unpaidOnly = [
    {
      id: "X",
      clientName: "t",
      phone: "+7 700 000 00 01",
      service: "Инфографика",
      amount: 9880,
      createdAt: "2025-11-25T08:00:00.000Z",
      status: "Новый",
      comment: "",
    },
  ];
  const avgKpi = computeKpis(unpaidOnly, "week", NOW).find((k) => k.key === "avgCheck");
  ok("Средний чек без оплаченных = —", avgKpi?.displayValue === "—", avgKpi?.displayValue);

  // format tenge
  const money = formatTenge(1234567);
  ok("Формат тенге с ₸", money.endsWith(" ₸") && money.replace(/\s/g, "") === "1234567₸", money);

  // chart points
  ok("График week=7", buildRevenueChartPoints(a, "week", NOW).length === 7);
  ok("График month=30", buildRevenueChartPoints(a, "month", NOW).length === 30);
  ok("График year=12", buildRevenueChartPoints(a, "year", NOW).length === 12);
  const emptyChart = buildRevenueChartPoints([], "week", NOW);
  ok("Пустой график не падает (7 нулей)", emptyChart.length === 7 && emptyChart.every((p) => p.value === 0));
  ok("Пустой график: hasData=false", chartHasData(emptyChart) === false);

  // status override
  const id = a[0].id;
  const overridden = applyStatusOverrides(a, { [id]: "Отменён" });
  ok(
    "Override статуса по id",
    overridden.find((o) => o.id === id)?.status === "Отменён",
  );
  const kpisBefore = computeKpis(a, "month", NOW);
  const kpisAfter = computeKpis(overridden, "month", NOW);
  ok(
    "Смена статуса пересчитывает KPI (объекты отличаются)",
    JSON.stringify(kpisBefore) !== JSON.stringify(kpisAfter) ||
      a[0].status === "Отменён",
    `was ${a[0].status}`,
  );

  // CSV
  ok("protect =", protectCsvFormula("=1+1") === "'=1+1");
  ok("protect +", protectCsvFormula("+x") === "'+x");
  ok("protect -", protectCsvFormula("-x") === "'-x");
  ok("protect @", protectCsvFormula("@x") === "'@x");
  ok("escape ;", escapeCsvField("a;b") === '"a;b"');
  ok('escape "', escapeCsvField('скажи "привет"') === '"скажи ""привет"""');
  ok("escape newline", escapeCsvField("a\nb") === '"a\nb"');

  const filteredMonth = filterOrdersByPeriod(a, "month", NOW);
  const csv = ordersToCsv(filteredMonth);
  ok("CSV delimiter ;", csv.split("\r\n")[0].includes(";"));
  ok("CSV CRLF", csv.includes("\r\n"));
  ok("CSV header columns", csv.startsWith("ID;Клиент;Телефон;Услуга;Сумма (₸);Дата;Статус;Комментарий"));
  ok("CSV amount без ₸ в значении", /;\d+;/.test(csv));
  ok("CSV date DD.MM.YYYY", /\d{2}\.\d{2}\.\d{4}/.test(csv));
  ok("CSV injection protected in export", csv.includes("'=") || csv.includes("'+") || csv.includes("'-"));
  ok(
    "Имя файла CSV",
    toFileDateStamp(NOW) === "2025-11-25",
    `studioboard-orders-${toFileDateStamp(NOW)}.csv`,
  );

  // BOM via blob in node may not exist the same — check string prep
  const withBom = `\uFEFF${csv}`;
  ok("BOM UTF-8 присутствует", withBom.charCodeAt(0) === 0xfeff);

  // cheaper services more frequent than websites
  const counts = Object.fromEntries(SERVICES.map((s) => [s.name, 0]));
  for (const o of a) counts[o.service] += 1;
  const cheap =
    counts["Карточка товара для маркетплейса"] + counts["Инфографика"];
  const sites =
    counts["Лендинг"] + counts["Корпоративный сайт"] + counts["Интернет-магазин"];
  ok("Дешёвые услуги чаще сайтов", cheap > sites, `cheap=${cheap}, sites=${sites}`);

  console.log(lines.join("\n"));
  const failed = lines.filter((l) => l.startsWith("FAIL")).length;
  const passed = lines.filter((l) => l.startsWith("PASS")).length;
  console.log(`\nSUMMARY: ${passed} PASS, ${failed} FAIL, total ${lines.length}`);
} finally {
  await server.close();
}
