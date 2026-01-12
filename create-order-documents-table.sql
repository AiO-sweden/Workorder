-- Create order_documents table for storing uploaded files
CREATE TABLE IF NOT EXISTS order_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' or 'document'
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES schedulable_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_documents_order_id ON order_documents(order_id);
CREATE INDEX IF NOT EXISTS idx_order_documents_organization_id ON order_documents(organization_id);

-- Enable Row Level Security
ALTER TABLE order_documents ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view documents in their organization"
  ON order_documents FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert documents in their organization"
  ON order_documents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update documents in their organization"
  ON order_documents FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete documents in their organization"
  ON order_documents FOR DELETE
  USING (auth.uid() IS NOT NULL);
