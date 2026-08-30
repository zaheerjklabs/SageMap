import { FeedbackItem, FeedbackCategory, FeedbackStatus, FeedbackStats } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const LOCAL_FEEDBACK_KEY = 'sagemap_local_feedbacks';

export interface DbFeedbackRow {
  id: string;
  user_id?: string | null;
  user_email?: string | null;
  user_name?: string | null;
  category: string;
  topic_id?: number | null;
  rating?: number | null;
  message: string;
  status: string;
  is_starred?: boolean;
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export function rowToFeedback(row: DbFeedbackRow): FeedbackItem {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    userEmail: row.user_email || undefined,
    userName: row.user_name || undefined,
    category: (row.category as FeedbackCategory) || 'general',
    topicId: row.topic_id ?? undefined,
    rating: row.rating ?? undefined,
    message: row.message || '',
    status: (row.status as FeedbackStatus) || 'new',
    isStarred: Boolean(row.is_starred),
    adminNotes: row.admin_notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || undefined,
  };
}

export function feedbackToRow(item: FeedbackItem): DbFeedbackRow {
  return {
    id: item.id,
    user_id: item.userId || null,
    user_email: item.userEmail || null,
    user_name: item.userName || null,
    category: item.category,
    topic_id: item.topicId ?? null,
    rating: item.rating ?? null,
    message: item.message,
    status: item.status,
    is_starred: item.isStarred ?? false,
    admin_notes: item.adminNotes || null,
    created_at: item.createdAt,
    updated_at: item.updatedAt || new Date().toISOString(),
  };
}

/**
 * Load feedbacks from local cache (clean real customer feedback only)
 */
export function getLocalFeedbacks(): FeedbackItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_FEEDBACK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any legacy demo IDs
        const realItems = parsed.filter((item: FeedbackItem) => item && item.id && !item.id.startsWith('fb_demo_'));
        return realItems;
      }
    }
  } catch (err) {
    console.warn('Failed to parse local feedbacks:', err);
  }
  return [];
}

/**
 * Save feedbacks to local cache
 */
export function saveLocalFeedbacks(feedbacks: FeedbackItem[]): void {
  try {
    localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(feedbacks));
  } catch (err) {
    console.warn('Failed to save feedbacks to localStorage:', err);
  }
}

/**
 * Submit user feedback to Supabase and cache locally
 */
export async function submitFeedback(input: {
  category: FeedbackCategory;
  message: string;
  topicId?: number;
  rating?: number;
  userName?: string;
  userEmail?: string;
  userId?: string;
}): Promise<FeedbackItem> {
  const newItem: FeedbackItem = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    category: input.category,
    message: input.message.trim(),
    topicId: input.topicId,
    rating: input.rating,
    userName: input.userName?.trim() || undefined,
    userEmail: input.userEmail?.trim() || undefined,
    userId: input.userId,
    status: 'new',
    isStarred: false,
    createdAt: new Date().toISOString(),
  };

  // 1. Immediately store in local cache
  const localList = getLocalFeedbacks();
  const updatedList = [newItem, ...localList.filter((f) => f.id !== newItem.id)];
  saveLocalFeedbacks(updatedList);

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const row = feedbackToRow(newItem);
      const { error } = await supabase.from('feedback').insert(row);
      if (error) {
        console.warn('Supabase feedback insert notice (saved locally):', error.message);
      }
    } catch (err) {
      console.warn('Could not post feedback to Supabase, stored locally:', err);
    }
  }

  return newItem;
}

/**
 * Fetch all real-time feedback items for Admin inbox
 */
export async function fetchAllFeedbacks(): Promise<FeedbackItem[]> {
  const localList = getLocalFeedbacks();

  if (!isSupabaseConfigured) {
    return localList;
  }

  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch feedback error, using local data:', error.message);
      return localList;
    }

    if (data && Array.isArray(data)) {
      const realDbFeedbacks = data
        .filter((r) => r.id && !r.id.startsWith('fb_demo_'))
        .map((r) => rowToFeedback(r as DbFeedbackRow));
      
      // Merge DB items with any locally submitted customer items
      const dbIdSet = new Set(realDbFeedbacks.map((f) => f.id));
      const unSyncedLocals = localList.filter((f) => !dbIdSet.has(f.id));
      const combined = [...unSyncedLocals, ...realDbFeedbacks].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      saveLocalFeedbacks(combined);
      return combined;
    }
  } catch (err) {
    console.warn('Failed to query feedback table in Supabase:', err);
  }

  return localList;
}

/**
 * Update feedback item status, starring, or admin notes
 */
export async function updateFeedbackItem(
  id: string,
  updates: Partial<Pick<FeedbackItem, 'status' | 'isStarred' | 'adminNotes'>>
): Promise<FeedbackItem | null> {
  // Update local cache
  const list = getLocalFeedbacks();
  let updatedItem: FeedbackItem | null = null;

  const updatedList = list.map((item) => {
    if (item.id === id) {
      updatedItem = {
        ...item,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return updatedItem;
    }
    return item;
  });

  saveLocalFeedbacks(updatedList);

  // Update Supabase if available
  if (isSupabaseConfigured && updatedItem) {
    try {
      const dbPayload: Partial<DbFeedbackRow> = {};
      if (updates.status !== undefined) dbPayload.status = updates.status;
      if (updates.isStarred !== undefined) dbPayload.is_starred = updates.isStarred;
      if (updates.adminNotes !== undefined) dbPayload.admin_notes = updates.adminNotes;
      dbPayload.updated_at = new Date().toISOString();

      const { error } = await supabase.from('feedback').update(dbPayload).eq('id', id);
      if (error) {
        console.warn('Supabase feedback update error:', error.message);
      }
    } catch (err) {
      console.warn('Could not sync feedback update to Supabase:', err);
    }
  }

  return updatedItem;
}

/**
 * Delete feedback item
 */
export async function deleteFeedbackItem(id: string): Promise<boolean> {
  // Update local cache
  const list = getLocalFeedbacks();
  const updatedList = list.filter((item) => item.id !== id);
  saveLocalFeedbacks(updatedList);

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('feedback').delete().eq('id', id);
      if (error) {
        console.warn('Supabase feedback delete error:', error.message);
      }
    } catch (err) {
      console.warn('Could not delete feedback in Supabase:', err);
    }
  }

  return true;
}

/**
 * Calculate inbox metrics and statistics
 */
export function computeFeedbackStats(items: FeedbackItem[]): FeedbackStats {
  const stats: FeedbackStats = {
    total: items.length,
    newCount: 0,
    inProgressCount: 0,
    resolvedCount: 0,
    archivedCount: 0,
    starredCount: 0,
    avgRating: 0,
    byCategory: {
      feature: 0,
      bug: 0,
      content: 0,
      general: 0,
      question: 0,
    },
  };

  let ratingSum = 0;
  let ratedCount = 0;

  for (const item of items) {
    if (item.status === 'new') stats.newCount++;
    else if (item.status === 'in_progress') stats.inProgressCount++;
    else if (item.status === 'resolved') stats.resolvedCount++;
    else if (item.status === 'archived') stats.archivedCount++;

    if (item.isStarred) stats.starredCount++;

    if (item.category && stats.byCategory[item.category] !== undefined) {
      stats.byCategory[item.category]++;
    }

    if (item.rating && item.rating >= 1 && item.rating <= 5) {
      ratingSum += item.rating;
      ratedCount++;
    }
  }

  stats.avgRating = ratedCount > 0 ? Number((ratingSum / ratedCount).toFixed(1)) : 5.0;

  return stats;
}

/**
 * Subscribe to realtime feedback changes
 */
export function subscribeToFeedbackChanges(
  onUpdate: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; item?: FeedbackItem; oldId?: string }) => void
): () => void {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  try {
    const channel = supabase
      .channel('feedback-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const item = rowToFeedback(payload.new as DbFeedbackRow);
            onUpdate({ eventType: 'INSERT', item });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const item = rowToFeedback(payload.new as DbFeedbackRow);
            onUpdate({ eventType: 'UPDATE', item });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            onUpdate({ eventType: 'DELETE', oldId: payload.old.id });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Could not establish Supabase Realtime feedback subscription:', err);
    return () => {};
  }
}
