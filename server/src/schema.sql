CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(32) NOT NULL UNIQUE,
  value VARCHAR(32) NOT NULL UNIQUE,
  type VARCHAR(16) NOT NULL DEFAULT 'clothing' CHECK (type IN ('clothing', 'outfit'))
);
CREATE TABLE IF NOT EXISTS clothing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(64),
  category_id UUID NOT NULL REFERENCES categories(id),
  image_urls JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS clothing_items_category_sort ON clothing_items(category_id, sort_order, created_at DESC);
CREATE TABLE IF NOT EXISTS outfit_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(64),
  name VARCHAR(32) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);
CREATE TABLE IF NOT EXISTS outfits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(64),
  outfit_category_id UUID NOT NULL REFERENCES outfit_categories(id),
  thumbnail_url VARCHAR(2048),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS outfit_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outfit_id UUID NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  part_type VARCHAR(8) NOT NULL CHECK (part_type IN ('head', 'neck', 'torso', 'legs', 'feet')),
  clothing_item_id UUID NOT NULL REFERENCES clothing_items(id),
  UNIQUE(outfit_id, part_type)
);

INSERT INTO categories (name, value) VALUES
  ('帽子', 'hat'), ('围巾', 'scarf'), ('上衣', 'top'), ('T恤', 'tshirt'), ('裙子', 'skirt'),
  ('裤子', 'pants'), ('连衣裙', 'dress'), ('袜子', 'socks'), ('鞋子', 'shoes')
ON CONFLICT (value) DO NOTHING;
INSERT INTO outfit_categories (user_id, name, is_default) VALUES
  (NULL, '春夏', TRUE), (NULL, '秋冬', TRUE), (NULL, '日常', TRUE)
ON CONFLICT (user_id, name) DO NOTHING;
