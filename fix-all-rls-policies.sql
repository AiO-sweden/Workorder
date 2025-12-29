-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- This will temporarily disable RLS on all relevant tables
-- This is the quickest way to confirm RLS is the problem

-- Disable RLS on schedulable_users (for user authentication)
ALTER TABLE schedulable_users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on customers (this is likely why customers disappear!)
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Disable RLS on orders
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Disable RLS on organizations
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on other tables if they exist
ALTER TABLE IF EXISTS tidsrapporteringar DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scheduled_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS work_types DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- NOTE: After confirming this fixes the issue, you can re-enable RLS
-- with proper policies later. For now, getting the app working is priority #1.
