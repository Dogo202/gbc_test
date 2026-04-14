# Настройка Telegram-уведомлений

## Шаг 1 — Создать бота и получить Token

1. Откройте Telegram, найдите **@BotFather**
2. Отправьте команду `/newbot`
3. Введите **имя бота** (отображаемое): `Nova Orders Bot`
4. Введите **username** (должен заканчиваться на `bot`): `nova_orders_bot`
5. BotFather пришлёт сообщение вида:

```
Done! Congratulations on your new bot.
Use this token to access the HTTP API:
1234567890:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

6. Скопируйте токен → вставьте в `.env`:
```
TELEGRAM_BOT_TOKEN=1234567890:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Шаг 2 — Получить Chat ID

### Вариант А: личный чат (уведомления только вам)

1. Найдите своего бота в Telegram и нажмите **Start**
2. Откройте в браузере:
   ```
   https://api.telegram.org/bot<ВАШ_TOKEN>/getUpdates
   ```
3. В ответе найдите `"chat": {"id": 123456789}` — это ваш Chat ID
4. Вставьте в `.env`:
   ```
   TELEGRAM_CHAT_ID=123456789
   ```

### Вариант Б: групповой чат (уведомления команде) — рекомендуется

1. Создайте группу в Telegram: `Nova Orders Alerts`
2. Добавьте бота в группу через "Добавить участника"
3. Сделайте бота **администратором** (иначе он не сможет писать)
4. Отправьте любое сообщение в группу
5. Откройте в браузере:
   ```
   https://api.telegram.org/bot<ВАШ_TOKEN>/getUpdates
   ```
6. Найдите `"chat": {"id": -1001234567890}` — ID группы (начинается с `-100`)
7. Вставьте в `.env`:
   ```
   TELEGRAM_CHAT_ID=-1001234567890
   ```

> **Важно:** Chat ID группы всегда отрицательный и начинается с `-100`.

### Вариант В: через @userinfobot (самый простой)

1. Для личного ID: напишите `/start` боту **@userinfobot**
2. Для ID группы: добавьте **@userinfobot** в группу — он напишет ID

---

## Шаг 3 — Проверить что всё работает

```bash
# Тестовое сообщение прямо из curl:
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "<CHAT_ID>", "text": "✅ Бот подключён и работает!"}'
```

Если пришло сообщение — всё настроено правильно.

---

## Шаг 4 — Настроить .env

Итоговый `.env` файл должен содержать:

```env
# RetailCRM
RETAILCRM_URL=https://yourshop.retailcrm.ru
RETAILCRM_API_KEY=your_api_key

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# Telegram
TELEGRAM_BOT_TOKEN=1234567890:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=-1001234567890

# Порог суммы для уведомления (в тенге)
NOTIFY_THRESHOLD_SUM=50000

# Синхронизация
SYNC_INTERVAL_MS=300000
ORDERS_LIMIT=100
```

---

## Шаг 5 — Запустить синхронизацию

```bash
# Однократный прогон
node src/sync.js

# Авто-синхронизация каждые 5 минут
node src/sync.js --watch
```

---

## Вариант 1: RetailCRM Webhooks (продвинутый режим)

Если ваш аккаунт RetailCRM поддерживает вебхуки:

1. Установите Express: `npm install express`
2. Запустите webhook-сервер: `node src/webhook.js`
3. Для локальной разработки используйте [ngrok](https://ngrok.com):
   ```bash
   ngrok http 3001
   # Скопируйте URL вида https://xxxx.ngrok-free.app
   ```
4. В RetailCRM: **Администрирование → Уведомления → Добавить webhook**
   - URL: `https://xxxx.ngrok-free.app/webhook/retailcrm`
   - Добавьте секрет в `.env`: `WEBHOOK_SECRET=my_secret`
   - События: ✅ Создание заказа, ✅ Изменение заказа
5. Для продакшна разверните на сервере (VPS, Railway, Fly.io) вместо ngrok

**Плюсы webhooks:** мгновенные уведомления, нет polling нагрузки.
**Минусы:** нужен публичный сервер, не работает на демо-аккаунте.

---

## Пример уведомления в Telegram

```
🔔 Крупный заказ! 81 000 ₸

📦 Заказ #1042
👤 Клиент: Феруза Юсупова
📱 Телефон: +77090123450
🏙️ Город: Алматы
📍 Адрес: ул. Мухамедханова 8, кв 73
🔗 Источник: referral

Состав заказа:
  • Утягивающий комбидресс Nova Slim × 1 — 28 000 ₸
  • Утягивающее боди Nova Body × 1 — 35 000 ₸
  • Утягивающие леггинсы Nova Fit × 1 — 18 000 ₸

💰 Итого: 81 000 ₸
⏰ 24.01.2025, 17:00:00
```
