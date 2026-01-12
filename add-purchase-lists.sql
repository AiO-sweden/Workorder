-- Add purchase lists functionality
-- Run this in Supabase SQL Editor

-- Table for custom purchase codes (like "gkc", "grossist", etc.)
CREATE TABLE IF NOT EXISTS purchase_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, code)
);

-- Table for purchase lists
CREATE TABLE IF NOT EXISTS purchase_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for purchase list items
CREATE TABLE IF NOT EXISTS purchase_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_list_id UUID NOT NULL REFERENCES purchase_lists(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  comment TEXT,
  purchase_code TEXT,
  checked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE purchase_codes IS 'Custom purchase codes like "gkc" (Gränsbyggden), "grossist", etc.';
COMMENT ON TABLE purchase_lists IS 'Purchase/shopping lists linked to work orders';
COMMENT ON TABLE purchase_list_items IS 'Individual items in purchase lists';

COMMENT ON COLUMN purchase_codes.code IS 'Short code like "gkc", "grossist"';
COMMENT ON COLUMN purchase_codes.description IS 'Full description like "Gränsbyggden", "Grossist"';
COMMENT ON COLUMN purchase_codes.color IS 'Hex color for UI display';

COMMENT ON COLUMN purchase_list_items.purchase_code IS 'Code indicating where to buy (gkc, grossist, beställa, etc.)';
COMMENT ON COLUMN purchase_list_items.comment IS 'Comments like "slut hos grossist", "beställa", etc.';
COMMENT ON COLUMN purchase_list_items.checked IS 'Whether the item has been purchased';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_lists_order_id ON purchase_lists(order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_lists_organization_id ON purchase_lists(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_list_items_list_id ON purchase_list_items(purchase_list_id);
CREATE INDEX IF NOT EXISTS idx_purchase_codes_organization_id ON purchase_codes(organization_id);

-- Add some default purchase codes (optional - can be customized per organization)
-- INSERT INTO purchase_codes (organization_id, code, description, color) VALUES
-- ((SELECT id FROM organizations LIMIT 1), 'grossist', 'Grossist', '#3b82f6'),
-- ((SELECT id FROM organizations LIMIT 1), 'gkc', 'Gränsbyggden', '#10b981'),
-- ((SELECT id FROM organizations LIMIT 1), 'beställa', 'Beställa', '#f59e0b'),
-- ((SELECT id FROM organizations LIMIT 1), 'finns', 'Finns i lager', '#8b5cf6');
