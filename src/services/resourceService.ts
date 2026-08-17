import { ResourceItem } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface DbResourceRow {
  id: string;
  topic_id: number;
  data: ResourceItem;
  created_at?: string;
  updated_at?: string;
}

export function rowToResource(row: DbResourceRow): ResourceItem {
  return {
    ...row.data,
    id: row.id,
    topicId: row.topic_id
  };
}

export function resourceToRow(resource: ResourceItem): DbResourceRow {
  const { id, topicId, ...rest } = resource;
  return {
    id,
    topic_id: topicId,
    data: {
      id,
      topicId,
      ...rest
    }
  };
}

/**
 * Fetches all saved / customized resources from the Supabase database.
 */
export async function fetchAllResources(): Promise<ResourceItem[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('resources')
    .select('id, topic_id, data, created_at, updated_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch resources from Supabase:', error.message);
    return [];
  }

  return (data as DbResourceRow[]).map(rowToResource);
}

/**
 * Creates or updates a resource permanently in Supabase.
 */
export async function upsertResource(resource: ResourceItem): Promise<ResourceItem | null> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please check your .env settings.');
  }

  const enrichedResource: ResourceItem = {
    ...resource,
    isEdited: true
  };

  const row = resourceToRow(enrichedResource);
  const { data, error } = await supabase
    .from('resources')
    .upsert(
      {
        id: row.id,
        topic_id: row.topic_id,
        data: row.data,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    )
    .select('id, topic_id, data, created_at, updated_at')
    .single();

  if (error) {
    console.error('Failed to upsert resource in Supabase:', error.message);
    throw new Error(error.message);
  }

  return rowToResource(data as DbResourceRow);
}

/**
 * Deletes a resource permanently from Supabase.
 */
export async function deleteResource(resourceId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', resourceId);

  if (error) {
    console.error('Failed to delete resource in Supabase:', error.message);
    throw new Error(error.message);
  }
}

/**
 * Seeds static resources to Supabase in batches of 25 if the database is currently empty.
 */
export async function seedResourcesIfEmpty(resources: ResourceItem[]): Promise<boolean> {
  if (!isSupabaseConfigured || resources.length === 0) return false;

  try {
    const { count, error: countError } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.warn('Failed to check resource count before seeding:', countError.message);
      return false;
    }

    if (count && count > 0) {
      return false;
    }

    return await syncAllResourcesToSupabase(resources);
  } catch (err) {
    console.error('Error during initial seed check:', err);
    return false;
  }
}

/**
 * Synchronizes the exact current website state to Supabase:
 * 1. Finds all resources currently in Supabase that are NOT in activeResources (i.e. deleted)
 *    and deletes them from Supabase.
 * 2. Upserts all current activeResources from the website to Supabase with latest data.
 * This guarantees that deletions are respected and never restored from static files!
 */
export async function pushWebsiteStateToSupabase(activeResources: ResourceItem[]): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    // 1. Fetch current DB row IDs
    const { data: dbRows, error: fetchError } = await supabase
      .from('resources')
      .select('id');

    if (fetchError) {
      console.error('Failed to fetch existing IDs from Supabase:', fetchError.message);
    } else if (dbRows && dbRows.length > 0) {
      const activeIds = new Set(activeResources.map(r => r.id));
      const idsToDelete = dbRows.filter(row => !activeIds.has(row.id)).map(row => row.id);

      // Delete any resources from Supabase that were deleted on the website
      if (idsToDelete.length > 0) {
        for (let i = 0; i < idsToDelete.length; i += 50) {
          const batch = idsToDelete.slice(i, i + 50);
          const { error: delError } = await supabase
            .from('resources')
            .delete()
            .in('id', batch);

          if (delError) {
            console.error('Failed to delete removed resources from Supabase:', delError.message);
          }
        }
      }
    }

    // 2. Upsert the current active resources from the website to Supabase
    if (activeResources.length > 0) {
      return await syncAllResourcesToSupabase(activeResources);
    }

    return true;
  } catch (err) {
    console.error('Error pushing website state to Supabase:', err);
    return false;
  }
}

/**
 * Synchronizes a list of resources into Supabase in robust chunks.
 */
export async function syncAllResourcesToSupabase(resources: ResourceItem[]): Promise<boolean> {
  if (!isSupabaseConfigured || resources.length === 0) return false;

  const chunkSize = 25;
  let hasErrors = false;

  for (let i = 0; i < resources.length; i += chunkSize) {
    const chunk = resources.slice(i, i + chunkSize);
    const rows = chunk.map(r => ({
      id: r.id,
      topic_id: r.topicId,
      data: r,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('resources')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error(`Failed to sync batch ${i / chunkSize + 1}:`, error.message);
      hasErrors = true;
    }
  }

  return !hasErrors;
}

/**
 * Subscribes to realtime updates on the 'resources' table.
 * Whenever an admin updates or deletes a resource, all connected clients are notified live.
 */
export function subscribeToResourceChanges(
  onChange: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; resource?: ResourceItem; oldId?: string }) => void
): () => void {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  const channel = supabase
    .channel('realtime_resources_feed')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'resources' },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as DbResourceRow)?.id;
          onChange({ eventType: 'DELETE', oldId });
        } else if (payload.new) {
          const res = rowToResource(payload.new as DbResourceRow);
          onChange({
            eventType: payload.eventType as 'INSERT' | 'UPDATE',
            resource: res
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
