import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CommunityPost, CommunityReply, CommunityCategory } from '../types';

const STORAGE_KEY_POSTS = 'sagemap_community_posts_cache';
const STORAGE_KEY_REPLIES = 'sagemap_community_replies_cache';

// Helper: generate unique ID
export const generateCommunityId = (prefix: 'post' | 'reply' = 'post') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Local Storage Helpers: Pure Real-Time Customer Data (Zero mock/starter questions)
export const getLocalCommunityPosts = (): CommunityPost[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POSTS);
    if (raw) {
      const parsed: CommunityPost[] = JSON.parse(raw);
      // Filter out any legacy starter/demo IDs if they existed in previous sessions
      const realOnly = parsed.filter((p) => !p.id.startsWith('post_starter_'));
      return realOnly;
    }
  } catch (e) {
    console.warn('Error reading local community posts cache:', e);
  }
  return [];
};

export const saveLocalCommunityPosts = (posts: CommunityPost[]) => {
  try {
    const realOnly = posts.filter((p) => !p.id.startsWith('post_starter_'));
    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(realOnly));
  } catch (e) {
    console.warn('Error saving local community posts cache:', e);
  }
};

/**
 * Fetch all community posts with their replies
 */
export const fetchAllCommunityPosts = async (): Promise<CommunityPost[]> => {
  if (!isSupabaseConfigured) {
    return getLocalCommunityPosts();
  }

  try {
    // 1. Fetch posts from Supabase
    const { data: postsData, error: postsError } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (postsError || !postsData) {
      console.warn('Supabase community_posts query notice:', postsError?.message);
      return getLocalCommunityPosts();
    }

    // 2. Fetch replies from Supabase
    const { data: repliesData, error: repliesError } = await supabase
      .from('community_replies')
      .select('*')
      .order('created_at', { ascending: true });

    if (repliesError) {
      console.warn('Supabase community_replies query notice:', repliesError.message);
    }

    const repliesList = repliesData || [];

    // 3. Map into CommunityPost interface (filtering out any legacy starter posts)
    const realPostsData = postsData.filter((row: any) => !String(row.id).startsWith('post_starter_'));
    const mappedPosts: CommunityPost[] = realPostsData.map((row: any) => {
      const postReplies: CommunityReply[] = repliesList
        .filter((r: any) => r.post_id === row.id && !String(r.id).startsWith('reply_starter_'))
        .map((r: any) => ({
          id: r.id,
          postId: r.post_id,
          userId: r.user_id,
          userEmail: r.user_email,
          userName: r.user_name,
          userRole: r.user_role || 'user',
          content: r.content,
          upvotes: Number(r.upvotes) || 0,
          upvotedBy: Array.isArray(r.upvoted_by) ? r.upvoted_by : [],
          isSolution: Boolean(r.is_solution),
          createdAt: r.created_at
        }));

      return {
        id: row.id,
        userId: row.user_id,
        userEmail: row.user_email,
        userName: row.user_name,
        userRole: row.user_role || 'user',
        title: row.title,
        content: row.content,
        category: row.category as CommunityCategory,
        topicId: row.topic_id ? Number(row.topic_id) : undefined,
        tags: Array.isArray(row.tags) ? row.tags : [],
        upvotes: Number(row.upvotes) || 0,
        upvotedBy: Array.isArray(row.upvoted_by) ? row.upvoted_by : [],
        isSolved: Boolean(row.is_solved),
        replyCount: postReplies.length,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        replies: postReplies
      };
    });

    saveLocalCommunityPosts(mappedPosts);
    return mappedPosts;
  } catch (err) {
    console.error('Error in fetchAllCommunityPosts:', err);
    return getLocalCommunityPosts();
  }
};

/**
 * Submit a new community post / question
 */
export const createCommunityPost = async (params: {
  userId?: string;
  userEmail: string;
  userName: string;
  userRole?: string;
  title: string;
  content: string;
  category: CommunityCategory;
  topicId?: number;
  tags?: string[];
}): Promise<{ data: CommunityPost | null; error: string | null }> => {
  const newId = generateCommunityId('post');
  const now = new Date().toISOString();

  const newPost: CommunityPost = {
    id: newId,
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
    userRole: params.userRole || 'user',
    title: params.title.trim(),
    content: params.content.trim(),
    category: params.category,
    topicId: params.topicId,
    tags: params.tags || [],
    upvotes: 1, // Author starts with 1 upvote
    upvotedBy: [params.userEmail],
    isSolved: false,
    replyCount: 0,
    createdAt: now,
    updatedAt: now,
    replies: []
  };

  // Optimistic local update
  const currentPosts = getLocalCommunityPosts();
  const updatedPosts = [newPost, ...currentPosts];
  saveLocalCommunityPosts(updatedPosts);

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('community_posts').insert({
        id: newPost.id,
        user_id: newPost.userId || null,
        user_email: newPost.userEmail,
        user_name: newPost.userName,
        user_role: newPost.userRole,
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        topic_id: newPost.topicId || null,
        tags: newPost.tags,
        upvotes: 1,
        upvoted_by: [newPost.userEmail],
        is_solved: false,
        created_at: now,
        updated_at: now
      });

      if (error) {
        console.warn('Could not insert post in Supabase:', error.message);
      }
    } catch (e) {
      console.warn('Network or DB error saving community post:', e);
    }
  }

  return { data: newPost, error: null };
};

/**
 * Submit a reply to a community post
 */
export const createCommunityReply = async (params: {
  postId: string;
  userId?: string;
  userEmail: string;
  userName: string;
  userRole?: string;
  content: string;
}): Promise<{ data: CommunityReply | null; error: string | null }> => {
  const newReplyId = generateCommunityId('reply');
  const now = new Date().toISOString();

  const newReply: CommunityReply = {
    id: newReplyId,
    postId: params.postId,
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
    userRole: params.userRole || 'user',
    content: params.content.trim(),
    upvotes: 1,
    upvotedBy: [params.userEmail],
    isSolution: false,
    createdAt: now
  };

  // Update local cache
  const posts = getLocalCommunityPosts();
  const targetPost = posts.find((p) => p.id === params.postId);
  if (targetPost) {
    targetPost.replies = [...(targetPost.replies || []), newReply];
    targetPost.replyCount = targetPost.replies.length;
    saveLocalCommunityPosts(posts);
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('community_replies').insert({
        id: newReply.id,
        post_id: newReply.postId,
        user_id: newReply.userId || null,
        user_email: newReply.userEmail,
        user_name: newReply.userName,
        user_role: newReply.userRole,
        content: newReply.content,
        upvotes: 1,
        upvoted_by: [newReply.userEmail],
        is_solution: false,
        created_at: now
      });

      if (error) {
        console.warn('Could not insert reply in Supabase:', error.message);
      }
    } catch (e) {
      console.warn('Error saving community reply:', e);
    }
  }

  return { data: newReply, error: null };
};

/**
 * Toggle Upvote on a Question / Post
 */
export const toggleUpvotePost = async (postId: string, userEmail: string): Promise<boolean> => {
  const posts = getLocalCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return false;

  const hasUpvoted = post.upvotedBy.includes(userEmail);
  if (hasUpvoted) {
    post.upvotedBy = post.upvotedBy.filter((e) => e !== userEmail);
    post.upvotes = Math.max(0, post.upvotes - 1);
  } else {
    post.upvotedBy.push(userEmail);
    post.upvotes += 1;
  }

  saveLocalCommunityPosts(posts);

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('community_posts')
        .update({
          upvotes: post.upvotes,
          upvoted_by: post.upvotedBy
        })
        .eq('id', postId);
    } catch (e) {
      console.warn('Error syncing upvote to Supabase:', e);
    }
  }

  return !hasUpvoted;
};

/**
 * Toggle Upvote on a Reply
 */
export const toggleUpvoteReply = async (postId: string, replyId: string, userEmail: string): Promise<boolean> => {
  const posts = getLocalCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post || !post.replies) return false;

  const reply = post.replies.find((r) => r.id === replyId);
  if (!reply) return false;

  const hasUpvoted = reply.upvotedBy.includes(userEmail);
  if (hasUpvoted) {
    reply.upvotedBy = reply.upvotedBy.filter((e) => e !== userEmail);
    reply.upvotes = Math.max(0, reply.upvotes - 1);
  } else {
    reply.upvotedBy.push(userEmail);
    reply.upvotes += 1;
  }

  saveLocalCommunityPosts(posts);

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('community_replies')
        .update({
          upvotes: reply.upvotes,
          upvoted_by: reply.upvotedBy
        })
        .eq('id', replyId);
    } catch (e) {
      console.warn('Error syncing reply upvote to Supabase:', e);
    }
  }

  return !hasUpvoted;
};

/**
 * Mark a Reply as the Accepted Solution
 */
export const toggleMarkSolution = async (postId: string, replyId: string): Promise<void> => {
  const posts = getLocalCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post || !post.replies) return;

  let anySolution = false;
  post.replies = post.replies.map((r) => {
    if (r.id === replyId) {
      const nextVal = !r.isSolution;
      if (nextVal) anySolution = true;
      return { ...r, isSolution: nextVal };
    }
    return r;
  });

  post.isSolved = anySolution;
  saveLocalCommunityPosts(posts);

  if (isSupabaseConfigured) {
    try {
      const targetReply = post.replies.find((r) => r.id === replyId);
      if (targetReply) {
        await supabase
          .from('community_replies')
          .update({ is_solution: targetReply.isSolution })
          .eq('id', replyId);

        await supabase
          .from('community_posts')
          .update({ is_solved: anySolution })
          .eq('id', postId);
      }
    } catch (e) {
      console.warn('Error syncing solution status:', e);
    }
  }
};

/**
 * Delete a Post (Admin or Post Creator)
 */
export const deleteCommunityPost = async (postId: string): Promise<void> => {
  const posts = getLocalCommunityPosts();
  const updated = posts.filter((p) => p.id !== postId);
  saveLocalCommunityPosts(updated);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('community_posts').delete().eq('id', postId);
    } catch (e) {
      console.warn('Error deleting post in Supabase:', e);
    }
  }
};

/**
 * Real-time Subscription Channel
 */
export const subscribeToCommunityChanges = (onDataChanged: () => void) => {
  if (!isSupabaseConfigured) return () => {};

  try {
    const channel = supabase
      .channel('community_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_posts' },
        () => {
          onDataChanged();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_replies' },
        () => {
          onDataChanged();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Could not establish community realtime subscription:', err);
    return () => {};
  }
};
