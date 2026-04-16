# Nova Orders Dashboard

Дашборд аналитики заказов на Next.js 14 + Supabase + Recharts.

## Стек

- **Next.js 14** (App Router, Server Components, ISR)
- **Supabase** — PostgreSQL база данных
- **Recharts** — графики
- **Tailwind CSS** — стили
- **TypeScript**

## Локальный запуск

```bash
# 1. Установить зависимости
npm install

# 2. Создать файл с переменными окружения
cp .env.local.example .env.local

# 3. Вписать ключи Supabase в .env.local:
#    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 4. Запустить dev-сервер
npm run dev
```

Открыть: http://localhost:3000

## Деплой на Vercel

### Способ 1 — через Vercel Dashboard (рекомендуется)

1. Создайте репозиторий на GitHub и запушьте проект
2. Откройте [vercel.com](https://vercel.com) → New Project → Import репозиторий
3. Vercel автоматически определит Next.js
4. В разделе **Environment Variables** добавьте:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Нажмите **Deploy**

### Способ 2 — через Vercel + Supabase Integration

1. В Vercel: **Storage** → **Connect Database** → **Supabase**
2. Авторизуйтесь в Supabase, выберите проект
3. Vercel автоматически пропишет переменные окружения
4. Deploy

### Способ 3 — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

## Структура

```
nova-dashboard/
├── app/
│   ├── layout.tsx      # Корневой layout, шрифты
│   ├── page.tsx        # Главная страница (Server Component)
│   └── globals.css     # Глобальные стили
├── components/
│   ├── StatCard.tsx    # KPI-карточки
│   ├── OrdersChart.tsx # График Recharts (заказы + выручка)
│   ├── OrdersTable.tsx # Таблица с фильтрами
│   ├── UtmChart.tsx    # Горизонтальные бары UTM-источников
│   └── StatusBadge.tsx # Бейджи статусов
├── lib/
│   └── supabase.ts     # Клиент, типы, запросы
├── .env.local.example
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

## Обновление данных

Страница использует **ISR** (Incremental Static Regeneration) с `revalidate = 60` — данные обновляются каждые 60 секунд без ручного деплоя.

Для real-time обновлений можно добавить Supabase Realtime подписки в клиентский компонент.
# Nova Orders Dashboard
