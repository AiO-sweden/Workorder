-- Fix RLS policies for schedulable_users table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- First, disable RLS temporarily to see if this is the problem
-- (You can re-enable it later with better policies)
ALTER TABLE schedulable_users DISABLE ROW LEVEL SECURITY;

-- If you want to keep RLS enabled, use these policies instead:
-- (Comment out the DISABLE line above and uncomment these)

/*
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own record" ON schedulable_users;
DROP POLICY IF EXISTS "Users can insert their own record" ON schedulable_users;
DROP POLICY IF EXISTS "Users can update their own record" ON schedulable_users;

-- Allow users to read their own record (this is critical!)
CREATE POLICY "Allow users to read own record"
  ON schedulable_users FOR SELECT
  USING (auth.uid() = id);

-- Allow users to insert their own record during signup
CREATE POLICY "Allow users to insert own record"
  ON schedulable_users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own record
CREATE POLICY "Allow users to update own record"
  ON schedulable_users FOR UPDATE
  USING (auth.uid() = id);
*/
