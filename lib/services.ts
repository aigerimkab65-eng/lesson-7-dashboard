import type { ServiceItem } from "@/lib/types";

/** Прайс-лист студии с весами частоты (дешёвые услуги чаще) */
export const SERVICES: ServiceItem[] = [
  { name: "AI-фотосессия", priceKzt: 23920, weight: 14 },
  { name: "Рекламный / трендовый AI-ролик", priceKzt: 43160, weight: 10 },
  { name: "3D-визуализация", priceKzt: 29120, weight: 9 },
  { name: "AI-анимация, оживление фото", priceKzt: 14560, weight: 12 },
  { name: "AI-персонаж и креативная концепция", priceKzt: 29120, weight: 8 },
  { name: "Карусель для Instagram", priceKzt: 23920, weight: 13 },
  { name: "Карточка товара для маркетплейса", priceKzt: 9880, weight: 15 },
  { name: "Инфографика", priceKzt: 9880, weight: 14 },
  { name: "Комплект карточек", priceKzt: 33800, weight: 7 },
  { name: "Сайт-визитка", priceKzt: 48400, weight: 4 },
  { name: "Лендинг", priceKzt: 96200, weight: 3 },
  { name: "Корпоративный сайт", priceKzt: 130000, weight: 2 },
  { name: "Интернет-магазин", priceKzt: 208000, weight: 1 },
];

export const SERVICE_WEIGHT_TOTAL = SERVICES.reduce(
  (sum, service) => sum + service.weight,
  0,
);
