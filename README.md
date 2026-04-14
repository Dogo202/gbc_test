
RetailCRM → Supabase синхронизация + дашборд аналитики.

## Структура
- `sync/` — скрипты синхронизации заказов и Telegram-уведомлений
- `dashboard/` — Next.js дашборд с графиками

## Быстрый старт

### Sync
```bash
cd sync
cp .env.example .env
# заполнить .env
npm install
node upload.js    # загрузить заказы в RetailCRM
node sync.js      # синхронизировать в Supabase
```

### Dashboard
```bash
cd dashboard
cp .env.local.example .env.local
# заполнить .env.local
npm install
npm run dev
```