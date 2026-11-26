import { DEMO_ORDERS_COUNT, DEMO_SEED } from "@/lib/constants";
import { createRng, pickIndex, randInt } from "@/lib/rng";
import { SERVICES } from "@/lib/services";
import { addAlmatyDays, endOfAlmatyDay, startOfAlmatyDay } from "@/lib/time";
import type { Order, OrderStatus } from "@/lib/types";

const CLIENT_POOL = [
  "Айгуль Нурланова",
  "Данияр Сериков",
  "Мария Иванова",
  "ТОО «Студия, Алматы»",
  'ИП "Қаһарман; дизайн"',
  "=Формула Тест",
  "+Плюс Клиент",
  "Нұржан Әбдіғалиұлы",
  "Гүлнар Құдайбергенова",
  "Асем Өмірзақ",
  "Ерлан Ғабит",
  "Сабина Үмбет",
  "Тимур Ілияс",
  "Очень длинное название клиента для проверки переноса текста в таблице StudioBoard Алматы Казахстан",
  "Жанна Бекова",
  "Арман Қасымов",
  "Laura Kim",
  "Бекзат Рахметов",
  "Диана Соколова",
  "Камила Жунусова",
];

const COMMENT_POOL = [
  "",
  "Нужен срочный черновик к пятнице",
  "Клиент просит больше воздуха в кадрах",
  'Комментарий с "кавычками" и деталями',
  "Строка 1\nСтрока 2 — перенос для CSV",
  "Поле; с точкой с запятой",
  "Қазақша пікір: әдемі визуал керек",
  "Согласовать логотип перед сдачей",
  "Повторный заказ, стиль как в прошлый раз",
];

const SERVICE_WEIGHTS = SERVICES.map((s) => s.weight);

function chooseStatus(rng: () => number, daysAgo: number): OrderStatus {
  const roll = rng();

  if (daysAgo <= 3) {
    if (roll < 0.45) return "Новый";
    if (roll < 0.8) return "В работе";
    if (roll < 0.92) return "Оплачен";
    return "Отменён";
  }

  if (daysAgo <= 14) {
    if (roll < 0.2) return "Новый";
    if (roll < 0.45) return "В работе";
    if (roll < 0.9) return "Оплачен";
    return "Отменён";
  }

  if (daysAgo <= 60) {
    if (roll < 0.05) return "Новый";
    if (roll < 0.15) return "В работе";
    if (roll < 0.93) return "Оплачен";
    return "Отменён";
  }

  if (roll < 0.02) return "В работе";
  if (roll < 0.94) return "Оплачен";
  return "Отменён";
}

function buildPhone(index: number): string {
  const n = String(12 + (index % 80)).padStart(2, "0");
  return `+7 700 000 00 ${n}`;
}

function makeOrderId(index: number): string {
  return `ORD-${String(index).padStart(4, "0")}`;
}

function createOrderAt(
  index: number,
  daysAgo: number,
  rng: () => number,
  now: Date,
  overrides?: Partial<Order>,
): Order {
  const dayStart = startOfAlmatyDay(addAlmatyDays(now, -daysAgo));
  const hour = randInt(rng, 9, 20);
  const minute = randInt(rng, 0, 59);
  const createdAt = new Date(
    dayStart.getTime() + hour * 60 * 60 * 1000 + minute * 60 * 1000,
  );

  const service = SERVICES[pickIndex(rng, SERVICE_WEIGHTS)];
  const quantity = randInt(rng, 1, 3);
  const urgent = rng() < 0.18;
  const amount = Math.round(service.priceKzt * quantity * (urgent ? 1.3 : 1));

  const clientName = CLIENT_POOL[randInt(rng, 0, CLIENT_POOL.length - 1)];
  const comment = COMMENT_POOL[randInt(rng, 0, COMMENT_POOL.length - 1)];

  return {
    id: makeOrderId(index),
    clientName,
    phone: buildPhone(index),
    service: service.name,
    amount,
    createdAt: createdAt.toISOString(),
    status: chooseStatus(rng, daysAgo),
    comment,
    ...overrides,
  };
}

/**
 * Демо-заказы: одинаковые при каждом reload для одной и той же даты «сейчас».
 * Даты считаются от now в Asia/Almaty, генератор с фиксированным seed.
 */
export function generateDemoOrders(now: Date): Order[] {
  const rng = createRng(DEMO_SEED);
  const orders: Order[] = [];
  let index = 1;

  // Гарантируем заказы в каждом периоде: сегодня, вчера, неделя, месяц, год
  const forcedDays = [
    0, 0, 1, 1, 2, 3, 4, 5, 6, 7, 10, 14, 20, 25, 29, 35, 45, 60, 90, 120, 150,
    180, 210, 240, 270, 300, 330, 350, 360, 364,
  ];

  for (const daysAgo of forcedDays) {
    orders.push(createOrderAt(index, daysAgo, rng, now));
    index += 1;
  }

  // Спец-клиенты для проверки CSV/UI — всегда присутствуют
  const trickySpecs: Array<{ daysAgo: number; patch: Partial<Order> }> = [
    {
      daysAgo: 2,
      patch: {
        clientName: 'ТОО "Студия, Алматы"',
        comment: "Срочно; уточнить брендбук",
      },
    },
    {
      daysAgo: 5,
      patch: {
        clientName: "=Формула Тест",
        comment: "Проверка CSV injection",
      },
    },
    {
      daysAgo: 8,
      patch: {
        clientName: "+Плюс Клиент",
        comment: "Строка один\nСтрока два",
      },
    },
    {
      daysAgo: 12,
      patch: {
        clientName:
          "Очень длинное название клиента StudioBoard — проверка переноса и адаптивной таблицы на телефоне",
        comment: 'Кавычки "внутри" комментария',
      },
    },
    {
      daysAgo: 18,
      patch: {
        clientName: "Нұржан Әбдіғалиұлы",
        comment: "Қажет: ә, ғ, қ, ң, ө, ұ, ү, һ, і",
      },
    },
    {
      daysAgo: 4,
      patch: {
        clientName: "-Скидка Тест",
        comment: "Имя с минусом для CSV-защиты",
      },
    },
  ];

  for (const spec of trickySpecs) {
    orders.push(createOrderAt(index, spec.daysAgo, rng, now, spec.patch));
    index += 1;
  }

  while (orders.length < DEMO_ORDERS_COUNT) {
    // Слегка смещаем распределение: больше заказов ближе к настоящему
    const skew = rng() ** 1.35;
    const daysAgo = Math.min(364, Math.floor(skew * 365));
    orders.push(createOrderAt(index, daysAgo, rng, now));
    index += 1;
  }

  // Сортировка: новые сверху
  orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Перенумеруем id по порядку появления во времени (старые = меньший номер)
  const chronological = [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  chronological.forEach((order, i) => {
    order.id = makeOrderId(i + 1);
  });

  return orders;
}

export function applyStatusOverrides(
  orders: Order[],
  overrides: Record<string, OrderStatus>,
): Order[] {
  if (!overrides || Object.keys(overrides).length === 0) {
    return orders;
  }
  return orders.map((order) => {
    const next = overrides[order.id];
    return next && next !== order.status ? { ...order, status: next } : order;
  });
}

/** Утилита: конец «сегодня» для тестов */
export function demoWindowEnd(now: Date): Date {
  return endOfAlmatyDay(now);
}
