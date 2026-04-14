# RetailCRM ↔ Supabase Sync

Два скрипта для синхронизации заказов между mock-данными, RetailCRM и Supabase.

## Структура

```
retailcrm-sync/
├── .env.example
├── package.json
├── mock_orders.json
├── src/
│   ├── upload.js      # Загрузка заказов из JSON → RetailCRM
│   ├── sync.js        # Синхронизация RetailCRM → Supabase
│   └── db.js          # Схема таблицы Supabase (SQL)
└── README.md
```

## Установка

```bash
npm install
cp .env.example .env
# Заполнить .env своими ключами
```

## Запуск

```bash
# Шаг 1: загрузить заказы в RetailCRM
node src/upload.js

# Шаг 2: синхронизировать RetailCRM → Supabase
node src/sync.js

# Авто-синхронизация каждые 5 минут
node src/sync.js --watch
```
