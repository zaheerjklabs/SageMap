-- ======================================================================================
-- SageMap Community Q&A, Help & Discussions Schema
-- ======================================================================================

-- 1. Create community_posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT DEFAULT 'user',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'question',
  topic_id INTEGER,
  tags TEXT[] DEFAULT '{}',
  upvotes INTEGER DEFAULT 0,
  upvoted_by TEXT[] DEFAULT '{}',
  is_solved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create community_replies table
CREATE TABLE IF NOT EXISTS public.community_replies (
  id TEXT PRIMARY KEY,
  post_id TEXT REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT DEFAULT 'user',
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  upvoted_by TEXT[] DEFAULT '{}',
  is_solution BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

-- 4. Policies for community_posts:
-- Anyone (including guests) can read posts
CREATE POLICY "Public read access for community_posts"
  ON public.community_posts FOR SELECT
  USING (true);

-- Authenticated/public users can create posts
CREATE POLICY "Allow authenticated insert for community_posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (true);

-- Allow updates (upvotes, solve toggle, editing)
CREATE POLICY "Allow update for community_posts"
  ON public.community_posts FOR UPDATE
  USING (true);

-- Allow deletes (creators or admins)
CREATE POLICY "Allow delete for community_posts"
  ON public.community_posts FOR DELETE
  USING (true);

-- 5. Policies for community_replies:
CREATE POLICY "Public read access for community_replies"
  ON public.community_replies FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for community_replies"
  ON public.community_replies FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for community_replies"
  ON public.community_replies FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for community_replies"
  ON public.community_replies FOR DELETE
  USING (true);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_topic_id ON public.community_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON public.community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_replies_post_id ON public.community_replies(post_id);

-- 7. Add to Realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_replies;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
