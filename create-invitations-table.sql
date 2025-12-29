-- Create invitations table for pending user invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by UUID REFERENCES schedulable_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, email)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_organization ON invitations(organization_id);

-- RLS Policies
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Admins can view invitations for their organization
CREATE POLICY "Admins can view organization invitations"
  ON invitations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM schedulable_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can create invitations for their organization
CREATE POLICY "Admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM schedulable_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Anyone can view their own invitation by token (for acceptance page)
CREATE POLICY "Anyone can view invitation by token"
  ON invitations FOR SELECT
  USING (true);

-- Update invitation status when accepted
CREATE POLICY "Users can update invitation status"
  ON invitations FOR UPDATE
  USING (status = 'pending');
