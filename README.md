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
- trailing slash в `RETAILCRM_URL` вызывает 405 Method Not Allowed — добавил `.replace(/\/$/, '')` на старте
- `apiKey` нужно передавать в query string для GET-запросов
- при повторных запусках sync.js могут дублироваться Telegram-уведомления — сразу сделал флаг `telegram_notified` в Supabase вместо Set() в памяти
- UPSERT вместо INSERT чтобы не было дублей в базе

**Где застрял 1 — тип заказа не существует.**
API отвечал ошибкой `"eshop-individual" does not exist`. Оказалось, в демо-аккаунте только один тип заказа — `main`. Решил через функцию `getAvailableOrderType()` которая запрашивает справочник `/api/v5/reference/order-types` и автоматически выбирает первый доступный тип.

**Где застрял 2 — Method Not Allowed при создании заказов.**
POST-запросы падали с 405. Проблема оказалась в endpoint: использовал `/api/v5/orders` вместо `/api/v5/orders/create`. RetailCRM требует отдельный endpoint для создания.

**Где застрял 3 — Parameter 'site' is missing.**
RetailCRM требует передавать символьный код магазина (`site`) при создании заказа. Добавил `RETAILCRM_SITE` в `.env` и передаю его в form body.

**Где застрял 4 — стили не работали на Vercel.**
Tailwind, postcss и autoprefixer были в `devDependencies` — Vercel в production их не устанавливал. Перенёс в `dependencies`. Параллельно переписал критические layout-стили на инлайн чтобы не зависеть от Tailwind для базовой структуры.

**Где застрял 5 — RangeError: Invalid time value на клиенте.**
`date-fns` в клиентских компонентах падал при невалидных датах из Supabase. Убрал `date-fns` из клиентских компонентов, заменил на нативный `Date.toLocaleString()` с проверкой `isNaN`.

**Дашборд** строил на Next.js 14 с App Router. Данные из Supabase тянутся server-side. Recharts-компоненты загружаются через `dynamic(..., { ssr: false })` чтобы избежать hydration mismatch.

**Telegram-бот** шлёт уведомление если сумма заказа > 50 000 ₸ и заказ моложе 24 часов. Флаг `telegram_notified` в Supabase предотвращает дубли при перезапуске.

---

## Промпты которые я использовал

<!-- Вставь сюда промпты которые давал Claude -->

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
├── CONTEXT.md                — контекст проекта для AI-ассистента
└── README.md
```

---

## Запуск локально

```bash
# Sync
cd sync
cp .env.example .env
# заполнить .env своими ключами
npm install
node upload.js          # загрузить заказы в RetailCRM
node sync.js            # разовая синхронизация в Supabase
node sync.js --watch    # авто-синхронизация каждые 5 минут

# Dashboard
cd dashboard
cp .env.local.example .env.local
# заполнить .env.local
npm install
npm run dev             # http://localhost:3000
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
TELEGRAM_CHAT_ID=-100...             # ID группы (отрицательный)
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
