-- Fix RLS policies for invitations table
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON invitations;
DROP POLICY IF EXISTS "Users can update invitation status" ON invitations;
DROP POLICY IF EXISTS "Admins can view organization invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;

-- Allow anyone to read invitations (they need a valid token anyway)
CREATE POLICY "Anyone can read invitations"
  ON invitations FOR SELECT
  USING (true);

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

-- Allow anyone to update invitation status from pending to accepted
-- This is needed for the invitation acceptance flow
CREATE POLICY "Allow invitation acceptance"
  ON invitations FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (status IN ('accepted', 'expired'));

-- Admins can update invitations in their organization
CREATE POLICY "Admins can update invitations"
  ON invitations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM schedulable_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete invitations in their organization
CREATE POLICY "Admins can delete invitations"
  ON invitations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM schedulable_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
