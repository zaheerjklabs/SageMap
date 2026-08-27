import { ResourceItem } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const METADATA_ROW_ID = '__sagemap_system_metadata__';

export interface DbResourceRow {
  id: string;
  topic_id: number;
  data: ResourceItem;
  created_at?: string;
  updated_at?: string;
}

export interface FetchResourcesResult {
  resources: ResourceItem[];
  deletedIds: string[];
  resourceOrder: string[];
  isInitialized: boolean;
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
 * Fetches all saved resources and system metadata from the Supabase database.
 * Real active database rows are strictly preserved as source of truth.
 */
export async function fetchAllResources(): Promise<FetchResourcesResult> {
  if (!isSupabaseConfigured) {
    return { resources: [], deletedIds: [], resourceOrder: [], isInitialized: false };
  }

  const { data, error } = await supabase
    .from('resources')
    .select('id, topic_id, data, created_at, updated_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch resources from Supabase:', error.message);
    return { resources: [], deletedIds: [], resourceOrder: [], isInitialized: false };
  }

  const rows = (data || []) as DbResourceRow[];
  let isInitialized = false;
  let deletedIds: string[] = [];
  let resourceOrder: string[] = [];
  const activeDbResources: ResourceItem[] = [];

  for (const row of rows) {
    if (row.id === METADATA_ROW_ID) {
      const meta = row.data as any;
      if (meta?.isInitialized) isInitialized = true;
      if (Array.isArray(meta?.deletedResourceIds)) {
        deletedIds = meta.deletedResourceIds;
      }
      if (Array.isArray(meta?.resourceOrder)) {
        resourceOrder = meta.resourceOrder;
      }
    } else if (!row.id.startsWith('__sagemap_')) {
      const res = rowToResource(row);
      if (res && res.title && res.url) {
        activeDbResources.push(res);
      }
    }
  }

  if (activeDbResources.length > 0) {
    isInitialized = true;
  }

  // Active DB rows take absolute priority over metadata tombstone list.
  // If an ID exists in activeDbResources, it MUST NOT be treated as deleted.
  const dbIdSet = new Set(activeDbResources.map((r) => r.id));
  const cleanedDeletedIds = deletedIds.filter((id) => !dbIdSet.has(id));

  // If deletedIds contained active DB IDs, clean up metadata in DB in background
  if (cleanedDeletedIds.length !== deletedIds.length) {
    supabase
      .from('resources')
      .upsert(
        {
          id: METADATA_ROW_ID,
          topic_id: 0,
          data: {
            isInitialized: true,
            deletedResourceIds: cleanedDeletedIds,
            lastSyncedAt: new Date().toISOString()
          } as any,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      )
      .then(() => {}, (e) => console.warn('Failed to clean metadata tombstone in DB:', e));
  }

  return {
    resources: activeDbResources,
    deletedIds: cleanedDeletedIds,
    resourceOrder,
    isInitialized
  };
}

/**
 * Creates or updates a resource permanently in Supabase.
 */
export async function upsertResource(
  resource: ResourceItem,
  existingDeletedIds: string[] = []
): Promise<ResourceItem | null> {
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

  // Atomically fetch and update DB metadata row to ensure resource.id is removed from deletedResourceIds and resourceOrder is preserved
  try {
    const { data: metaRow } = await supabase
      .from('resources')
      .select('data')
      .eq('id', METADATA_ROW_ID)
      .maybeSingle();

    let currentDeleted: string[] = existingDeletedIds;
    let currentOrder: string[] = [];
    if (metaRow?.data) {
      const meta = metaRow.data as any;
      if (Array.isArray(meta.deletedResourceIds)) {
        currentDeleted = meta.deletedResourceIds;
      }
      if (Array.isArray(meta.resourceOrder)) {
        currentOrder = meta.resourceOrder;
      }
    }

    const updatedDeleted = currentDeleted.filter((id) => id !== resource.id);
    await supabase
      .from('resources')
      .upsert(
        {
          id: METADATA_ROW_ID,
          topic_id: 0,
          data: {
            isInitialized: true,
            deletedResourceIds: updatedDeleted,
            resourceOrder: currentOrder,
            lastSyncedAt: new Date().toISOString()
          } as any,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );
  } catch (metaErr) {
    console.warn('Atomic metadata update notice:', metaErr);
  }

  return rowToResource(data as DbResourceRow);
}

/**
 * Deletes a resource permanently from Supabase and records its ID in metadata deleted list.
 */
export async function deleteResource(
  resourceId: string,
  existingDeletedIds: string[] = []
): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  // 1. Delete row from Supabase
  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', resourceId);

  if (error) {
    console.error('Failed to delete resource in Supabase:', error.message);
    throw new Error(error.message);
  }

  // 2. Fetch current DB metadata to append deletion tombstone cleanly and preserve resource order
  let currentDeleted = [...existingDeletedIds];
  let currentOrder: string[] = [];
  try {
    const { data: metaRow } = await supabase
      .from('resources')
      .select('data')
      .eq('id', METADATA_ROW_ID)
      .maybeSingle();

    if (metaRow?.data) {
      const meta = metaRow.data as any;
      if (Array.isArray(meta.deletedResourceIds)) {
        currentDeleted = meta.deletedResourceIds;
      }
      if (Array.isArray(meta.resourceOrder)) {
        currentOrder = meta.resourceOrder;
      }
    }
  } catch (e) {
    console.warn('Metadata fetch notice on delete:', e);
  }

  const updatedDeleted = Array.from(new Set([...currentDeleted, resourceId]));
  const updatedOrder = currentOrder.filter((id) => id !== resourceId);

  try {
    await supabase
      .from('resources')
      .upsert(
        {
          id: METADATA_ROW_ID,
          topic_id: 0,
          data: {
            isInitialized: true,
            deletedResourceIds: updatedDeleted,
            resourceOrder: updatedOrder,
            lastSyncedAt: new Date().toISOString()
          } as any,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );
  } catch (metaErr) {
    console.warn('Failed to update system metadata in Supabase:', metaErr);
  }
}

/**
 * Seeds static resources to Supabase in batches if the database has never been initialized.
 * If already initialized (even if all resources were deleted), it does NOT re-seed.
 */
export async function seedResourcesIfEmpty(resources: ResourceItem[]): Promise<boolean> {
  if (!isSupabaseConfigured || resources.length === 0) return false;

  try {
    // Check if metadata row already exists
    const { data: metaRow } = await supabase
      .from('resources')
      .select('id, data')
      .eq('id', METADATA_ROW_ID)
      .maybeSingle();

    if (metaRow?.data && (metaRow.data as any).isInitialized) {
      // Already initialized - respect user deletions and do not re-seed!
      return false;
    }

    const { count, error: countError } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true });

    if (!countError && count && count > 0) {
      // Existing data exists, mark system metadata as initialized
      await supabase
        .from('resources')
        .upsert(
          {
            id: METADATA_ROW_ID,
            topic_id: 0,
            data: {
              isInitialized: true,
              deletedResourceIds: [],
              lastSyncedAt: new Date().toISOString()
            } as any,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        );
      return false;
    }

    // Seed all resources in robust chunks
    const success = await syncAllResourcesToSupabase(resources);
    if (success) {
      await supabase
        .from('resources')
        .upsert(
          {
            id: METADATA_ROW_ID,
            topic_id: 0,
            data: {
              isInitialized: true,
              deletedResourceIds: [],
              lastSyncedAt: new Date().toISOString()
            } as any,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        );
    }
    return success;
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
 * 3. Updates system metadata to record deletedResourceIds and initialized state.
 */
export async function pushWebsiteStateToSupabase(
  activeResources: ResourceItem[],
  existingDeletedIds: string[] = [],
  resourceOrder: string[] = []
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    // 1. Fetch current DB row IDs & current metadata
    const { data: dbRows, error: fetchError } = await supabase
      .from('resources')
      .select('id');

    let allDeleted = [...existingDeletedIds];

    if (fetchError) {
      console.error('Failed to fetch existing IDs from Supabase:', fetchError.message);
    } else if (dbRows && dbRows.length > 0) {
      const activeIds = new Set(activeResources.map((r) => r.id));
      const idsToDelete = dbRows
        .filter((row) => !row.id.startsWith('__sagemap_') && !activeIds.has(row.id))
        .map((row) => row.id);

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
        allDeleted = Array.from(new Set([...allDeleted, ...idsToDelete]));
      }
    }

    const activeIds = new Set(activeResources.map((r) => r.id));
    const cleanedDeleted = allDeleted.filter((id) => !activeIds.has(id));

    // 2. Upsert the current active resources from the website to Supabase
    if (activeResources.length > 0) {
      await syncAllResourcesToSupabase(activeResources);
    }

    // 3. Resolve resourceOrder (use passed array or retrieve existing from DB)
    let finalOrder = [...resourceOrder];
    if (finalOrder.length === 0) {
      const { data: metaRow } = await supabase
        .from('resources')
        .select('data')
        .eq('id', METADATA_ROW_ID)
        .maybeSingle();
      if (metaRow?.data && Array.isArray((metaRow.data as any).resourceOrder)) {
        finalOrder = (metaRow.data as any).resourceOrder;
      }
    }

    // Clean deleted items from finalOrder
    const finalCleanedOrder = finalOrder.filter((id) => activeIds.has(id));

    // 4. Persist system metadata including resource order
    await supabase
      .from('resources')
      .upsert(
        {
          id: METADATA_ROW_ID,
          topic_id: 0,
          data: {
            isInitialized: true,
            deletedResourceIds: cleanedDeleted,
            resourceOrder: finalCleanedOrder,
            lastSyncedAt: new Date().toISOString()
          } as any,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );

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
    const rows = chunk.map((r) => ({
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
 * Persists the customized drag-and-drop position order of resources to Supabase metadata.
 */
export async function saveResourceOrder(orderIds: string[]): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { data: metaRow } = await supabase
      .from('resources')
      .select('data')
      .eq('id', METADATA_ROW_ID)
      .maybeSingle();

    let currentMeta: any = { isInitialized: true, deletedResourceIds: [] };
    if (metaRow?.data) {
      currentMeta = metaRow.data;
    }

    const updatedMeta = {
      ...currentMeta,
      resourceOrder: orderIds,
      lastSyncedAt: new Date().toISOString()
    };

    const { error } = await supabase
      .from('resources')
      .upsert(
        {
          id: METADATA_ROW_ID,
          topic_id: 0,
          data: updatedMeta,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Failed to save resource order to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving resource order:', err);
    return false;
  }
}

/**
 * Subscribes to realtime updates on the 'resources' table.
 * Whenever an admin updates or deletes a resource, all connected clients are notified live.
 */
export function subscribeToResourceChanges(
  onChange: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'METADATA_UPDATE';
    resource?: ResourceItem;
    oldId?: string;
    deletedIds?: string[];
    resourceOrder?: string[];
  }) => void
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
        const targetId = (payload.new as any)?.id || (payload.old as any)?.id;

        if (targetId === METADATA_ROW_ID) {
          if (payload.new) {
            const meta = (payload.new as any).data;
            if (meta) {
              onChange({
                eventType: 'METADATA_UPDATE',
                deletedIds: Array.isArray(meta.deletedResourceIds) ? meta.deletedResourceIds : [],
                resourceOrder: Array.isArray(meta.resourceOrder) ? meta.resourceOrder : []
              });
            }
          }
          return;
        }

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

