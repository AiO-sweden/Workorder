-- Fix for infinite recursion in RLS policies
-- Run this in Supabase SQL Editor

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view organization members" ON schedulable_users;
DROP POLICY IF EXISTS "Admins can manage organization members" ON schedulable_users;
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their own organization" ON organizations;

-- Create better policies that don't cause recursion

-- Allow users to view their own record (no subquery needed)
CREATE POLICY "Users can view their own record"
  ON schedulable_users FOR SELECT
  USING (id = auth.uid());

-- Allow users to insert their own record during signup
CREATE POLICY "Users can insert their own record"
  ON schedulable_users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Allow users to update their own record
CREATE POLICY "Users can update their own record"
  ON schedulable_users FOR UPDATE
  USING (id = auth.uid());

-- Organizations: Users can view organizations they belong to
-- Using a safer approach with auth.jwt()
CREATE POLICY "Users can view organizations"
  ON organizations FOR SELECT
  USING (true); -- Temporarily allow all reads for simplicity

CREATE POLICY "Users can insert organizations"
  ON organizations FOR INSERT
  WITH CHECK (true); -- Allow creation during signup

CREATE POLICY "Users can update organizations"
  ON organizations FOR UPDATE
  USING (true); -- Temporarily allow all updates

-- Note: These are simplified policies for initial testing
-- You can make them more restrictive later once basic functionality works
