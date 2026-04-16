# Orders Dashboard

Дашборд для мониторинга заказов: RetailCRM → Supabase → Next.js (Vercel) + Telegram-бот.

**[🔗 Дашборд (Vercel) →](https://gbc-test-psi.vercel.app)**
**[📁 Репозиторий →](https://github.com/Dogo202/gbc_test)**

---

## Стек

| | |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts |
| База данных | Supabase (PostgreSQL) |
| CRM | RetailCRM API v5 |
| Деплой | Vercel |
| Уведомления | Telegram Bot API |

---

## Как делал — по шагам

Перед началом изучил опыт других и учёл типичные проблемы заранее:
- при повторных запусках sync.js могут дублироваться Telegram-уведомления — сразу сделал флаг `telegram_notified` в Supabase вместо Set() в памяти
- UPSERT вместо INSERT чтобы не было дублей в базе
- API отвечал ошибкой `"eshop-individual" does not exist`. Оказалось, в демо-аккаунте только один тип заказа — `main`. Решил через функцию `getAvailableOrderType()` которая запрашивает справочник `/api/v5/reference/order-types` и автоматически выбирает первый доступный тип.

**Где застрял 1 — Parameter 'site' is missing.**
RetailCRM требует передавать символьный код магазина (`site`) при создании заказа. Добавил `RETAILCRM_SITE` в `.env` и передаю его в form body.

**Где застрял 2 — стили не работали на Vercel.**
Tailwind, postcss и autoprefixer были в `devDependencies` — Vercel в production их не устанавливал. Перенёс в `dependencies`. Параллельно переписал критические layout-стили на инлайн чтобы не зависеть от Tailwind для базовой структуры.

**Где застрял 3 — RangeError: Invalid time value на клиенте.**
`date-fns` в клиентских компонентах падал при невалидных датах из Supabase. Убрал `date-fns` из клиентских компонентов, заменил на нативный `Date.toLocaleString()` с проверкой `isNaN`.

**Дашборд** строил на Next.js 14 с App Router. Данные из Supabase тянутся server-side. Recharts-компоненты загружаются через `dynamic(..., { ssr: false })` чтобы избежать hydration mismatch.

**Telegram-бот** шлёт уведомление если сумма заказа > 50 000 ₸ и заказ моложе 24 часов. Флаг `telegram_notified` в Supabase предотвращает дубли при перезапуске.

---

## Промпты которые я использовал

 
> Мне нужно написать скрипт на [Node.js/Python], который выполняет две задачи:
  Читает файл mock_orders.json (50 заказов) и загружает их в RetailCRM через API.
  Регулярно (или по запуску) забирает новые заказы из RetailCRM и синхронизирует их с таблицей в Supabase.
  Пожалуйста:
  Спроектируй структуру таблицы в Supabase, чтобы она соответствовала полям из RetailCRM (ID, сумма, статус, дата).
  Напиши чистый код скрипта с использованием официальных SDK или axios.
  Используй переменные окружения (.env) для API-ключей и URL." 

> Мне нужно создать веб-дашборд на Next.js или React, который будет отображать данные из таблицы Supabase, созданной на предыдущем шаге. Требования: 
 Главный экран: График заказов по дням (используй библиотеку Recharts или Chart.js).
 Список последних заказов в виде таблицы.
 Стильный интерфейс на Tailwind CSS.
 Код должен быть готов к деплою на Vercel (подключение через стандартный коннектор Supabase)." 

> Настрой логику уведомлений в Telegram. Условие: Если в RetailCRM появляется заказ на сумму более 50,000 тенге (₸), бот должен отправить сообщение в чат. Подскажи лучший вариант реализации: 
  Использовать Webhooks от RetailCRM (если позволяет демо-аккаунт).
  Или добавить проверку суммы в наш основной скрипт синхронизации. Напиши код для отправки сообщения через Telegram Bot API и приложи инструкцию, как получить Token и Chat ID."



---

## Структура проекта

```
gbc/
├── sync/
│   ├── upload.js             — загрузка 50 заказов из mock_orders.json → RetailCRM
│   ├── sync.js               — синхронизация RetailCRM → Supabase + Telegram
│   ├── telegram.js           — модуль уведомлений
│   ├── webhook.js            — Express сервер для webhooks (для продакшн-аккаунта)
│   ├── mock_orders.json      — 50 тестовых заказов
│   ├── db.sql                — SQL схема таблицы Supabase
│   ├── .env.example          — шаблон переменных окружения
│   └── package.json
├── dashboard/
│   ├── app/
│   │   ├── page.tsx          — главная страница (Server Component)
│   │   ├── layout.tsx        — шрифты и глобальные стили
│   │   └── globals.css
│   ├── components/
│   │   ├── OrdersChart.tsx   — Recharts ComposedChart (бары + линия выручки)
│   │   ├── OrdersTable.tsx   — таблица с поиском и фильтром по статусу
│   │   ├── StatCard.tsx      — KPI карточки
│   │   ├── StatusBadge.tsx   — цветные бейджи статусов
│   │   └── UtmChart.tsx      — горизонтальные бары UTM-источников
│   ├── lib/
│   │   └── supabase.ts       — клиент, типы, запросы
│   └── package.json
└── README.md
```

---

## Переменные окружения

### sync/.env
```env
RETAILCRM_URL=https://yourdomain.retailcrm.ru
RETAILCRM_API_KEY=...
RETAILCRM_SITE=...                    # символьный код магазина

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...           # service_role ключ

TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=100...             # ID чата
NOTIFY_THRESHOLD_SUM=50000
SYNC_INTERVAL_MS=300000
UPLOAD_BATCH_DELAY_MS=500
```

### dashboard/.env.local
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # anon ключ
```

---

## Схема таблицы Supabase

```sql
id                  INTEGER PRIMARY KEY      -- ID из RetailCRM
number              TEXT UNIQUE              -- номер заказа (#1001)
order_type          TEXT                     -- тип заказа
order_method        TEXT                     -- способ оформления
status              TEXT                     -- new | in-progress | complete | cancel
total_sum           NUMERIC(12,2)            -- сумма в тенге
customer_first_name TEXT
customer_last_name  TEXT
customer_phone      TEXT
customer_email      TEXT
delivery_city       TEXT
delivery_address    TEXT
utm_source          TEXT
telegram_notified   BOOLEAN DEFAULT false
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
synced_at           TIMESTAMPTZ
raw_data            JSONB
```
