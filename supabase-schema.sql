-- AIO Arbetsorder - Supabase/PostgreSQL Schema
-- Migration från Firebase Firestore till Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  org_nr TEXT UNIQUE,
  address TEXT,
  zip_code TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  bank_account TEXT,
  bank_name TEXT,
  bic_swift TEXT,
  iban TEXT,
  f_skatt_approved BOOLEAN DEFAULT false,
  vat_nr TEXT,
  logo_url TEXT,
  our_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE schedulable_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  customer_number TEXT NOT NULL,
  name TEXT NOT NULL,
  org_nr TEXT,
  address TEXT,
  zip_code TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  invoice_by TEXT,
  payment_terms TEXT,
  reference_person TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, customer_number)
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT,
  work_type TEXT NOT NULL,
  status TEXT DEFAULT 'Ej påbörjad' CHECK (status IN ('Planerad', 'Ej påbörjad', 'Pågående', 'Klar för fakturering', 'Full fakturerad')),
  priority TEXT DEFAULT 'Mellan' CHECK (priority IN ('Låg', 'Mellan', 'Hög')),
  billing_type TEXT DEFAULT 'Löpande pris' CHECK (billing_type IN ('Löpande pris', 'Fast pris')),
  billable BOOLEAN DEFAULT true,
  fixed_price NUMERIC(10, 2),
  deadline TIMESTAMP WITH TIME ZONE,
  estimated_time NUMERIC(10, 2),
  assigned_to UUID[] DEFAULT '{}',
  created_by UUID REFERENCES schedulable_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, order_number)
);

-- ============================================
-- TIME REPORTS TABLE
-- ============================================
CREATE TABLE time_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES schedulable_users(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  hours NUMERIC(10, 2) NOT NULL,
  comment TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SCHEDULED JOBS TABLE
-- ============================================
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES schedulable_users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ARTICLES TABLE (Product/Service Catalog)
-- ============================================
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  article_number TEXT NOT NULL,
  name TEXT NOT NULL,
  purchase_price NUMERIC(10, 2),
  unit TEXT,
  supplier TEXT CHECK (supplier IN ('Solar', 'Dahl', 'Egen')),
  category TEXT,
  rsk_number TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, supplier, article_number)
);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  time_codes JSONB DEFAULT '[]',
  work_types JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_schedulable_users_org ON schedulable_users(organization_id);
CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_orders_org ON orders(organization_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_time_reports_org ON time_reports(organization_id);
CREATE INDEX idx_time_reports_order ON time_reports(order_id);
CREATE INDEX idx_time_reports_user ON time_reports(user_id);
CREATE INDEX idx_time_reports_date ON time_reports(date);
CREATE INDEX idx_scheduled_jobs_org ON scheduled_jobs(organization_id);
CREATE INDEX idx_scheduled_jobs_order ON scheduled_jobs(order_id);
CREATE INDEX idx_scheduled_jobs_user ON scheduled_jobs(user_id);
CREATE INDEX idx_scheduled_jobs_time ON scheduled_jobs(start_time, end_time);
CREATE INDEX idx_articles_org ON articles(organization_id);
CREATE INDEX idx_articles_supplier_name ON articles(supplier, name);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedulable_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Schedulable Users: Users can see users in their organization
CREATE POLICY "Users can view organization members"
  ON schedulable_users FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage organization members"
  ON schedulable_users FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customers: Scoped to organization
CREATE POLICY "Users can view organization customers"
  ON customers FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage organization customers"
  ON customers FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid()
    )
  );

-- Orders: Scoped to organization
CREATE POLICY "Users can view organization orders"
  ON orders FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage organization orders"
  ON orders FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid()
    )
  );

-- Time Reports: Scoped to organization
CREATE POLICY "Users can view organization time reports"
  ON time_reports FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create time reports"
  ON time_reports FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own time reports"
  ON time_reports FOR UPDATE
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Scheduled Jobs: Scoped to organization
CREATE POLICY "Users can view organization scheduled jobs"
  ON scheduled_jobs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage organization scheduled jobs"
  ON scheduled_jobs FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid()
    )
  );

-- Articles: Scoped to organization
CREATE POLICY "Users can view organization articles"
  ON articles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage organization articles"
  ON articles FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid()
    )
  );

-- Settings: Scoped to organization
CREATE POLICY "Users can view organization settings"
  ON settings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage organization settings"
  ON settings FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- FUNCTIONS FOR AUTO-UPDATING updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedulable_users_updated_at BEFORE UPDATE ON schedulable_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_reports_updated_at BEFORE UPDATE ON time_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_jobs_updated_at BEFORE UPDATE ON scheduled_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA / SEED
-- ============================================
-- This will be populated during migration
