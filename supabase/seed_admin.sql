-- ==============================================================================
-- SageMap: Quick Admin Promotion & Setup Script
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Ensure public.profiles exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Promote ALL registered users in auth.users to 'admin' (or replace with specific email):
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 3. Verify admin list:
SELECT id, email, role, created_at FROM public.profiles WHERE role = 'admin';

-- 4. Verify that the 'resources' table is published to Supabase Realtime:
ALTER PUBLICATION supabase_realtime ADD TABLE public.resources;
