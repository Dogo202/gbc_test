-- =============================================================
-- Схема таблицы orders для Supabase
-- Соответствует реальной структуре mock_orders.json
-- Выполнить в: Supabase → SQL Editor
-- =============================================================

CREATE TABLE IF NOT EXISTS orders (
  -- ID заказа из RetailCRM (присваивается после создания)
  id              INTEGER       PRIMARY KEY,

  -- Номер заказа (генерируется RetailCRM, например #1001)
  number          TEXT          UNIQUE,

  -- Тип и способ оформления заказа
  order_type      TEXT          NOT NULL DEFAULT 'eshop-individual',
  order_method    TEXT          NOT NULL DEFAULT 'shopping-cart',

  -- Статус заказа (new | in-progress | complete | cancel | и др.)
  status          TEXT          NOT NULL DEFAULT 'new',

  -- Сумма заказа (qty * price по каждому item)
  total_sum       NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Данные клиента
  customer_first_name  TEXT,
  customer_last_name   TEXT,
  customer_phone       TEXT,
  customer_email       TEXT,

  -- Данные доставки
  delivery_city        TEXT,
  delivery_address     TEXT,

  -- UTM-метки (из customFields)
  utm_source           TEXT,

  -- Временны́е метки
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  synced_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),

  -- Полный JSON ответа RetailCRM
  raw_data        JSONB
);

CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_utm_source  ON orders (utm_source);
CREATE INDEX IF NOT EXISTS idx_orders_city        ON orders (delivery_city);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- Маппинг: mock_orders.json / RetailCRM → таблица orders
-- =============================================================
-- order.id (CRM-ответ)          → id (PK)
-- order.number (CRM-ответ)      → number
-- order.orderType               → order_type
-- order.orderMethod             → order_method
-- order.status                  → status
-- sum(item.qty * item.price)    → total_sum
-- order.firstName               → customer_first_name
-- order.lastName                → customer_last_name
-- order.phone                   → customer_phone
-- order.email                   → customer_email
-- order.delivery.address.city   → delivery_city
-- order.delivery.address.text   → delivery_address
-- order.customFields.utm_source → utm_source
-- order.createdAt (CRM)         → created_at
-- order.updatedAt (CRM)         → updated_at
