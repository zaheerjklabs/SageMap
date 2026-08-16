import { ResourceItem } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface DbResourceRow {
  id: string;
  topic_id: number;
  data: ResourceItem;
}

function rowToResource(row: DbResourceRow): ResourceItem {
  return {
    ...row.data,
    id: row.id,
    topicId: row.topic_id
  };
}

function resourceToRow(resource: ResourceItem): DbResourceRow {
  const { id, topicId, ...rest } = resource;
  return {
    id,
    topic_id: topicId,
    data: { id, topicId, ...rest }
  };
}

export async function fetchAllResources(): Promise<ResourceItem[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('resources')
    .select('id, topic_id, data')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch resources from Supabase:', error.message);
    return [];
  }

  return (data as DbResourceRow[]).map(rowToResource);
}

export async function createResource(resource: ResourceItem): Promise<ResourceItem | null> {
  if (!isSupabaseConfigured) return null;

  const row = resourceToRow(resource);
  const { data, error } = await supabase
    .from('resources')
    .insert(row)
    .select('id, topic_id, data')
    .single();

  if (error) {
    console.error('Failed to create resource:', error.message);
    throw new Error(error.message);
  }

  return rowToResource(data as DbResourceRow);
}

export async function updateResource(resource: ResourceItem): Promise<ResourceItem | null> {
  if (!isSupabaseConfigured) return null;

  const row = resourceToRow(resource);
  const { data, error } = await supabase
    .from('resources')
    .update({ topic_id: row.topic_id, data: row.data })
    .eq('id', resource.id)
    .select('id, topic_id, data')
    .single();

  if (error) {
    console.error('Failed to update resource:', error.message);
    throw new Error(error.message);
  }

  return rowToResource(data as DbResourceRow);
}

export async function upsertResource(resource: ResourceItem): Promise<ResourceItem | null> {
  if (!isSupabaseConfigured) return null;

  const row = resourceToRow(resource);
  const { data, error } = await supabase
    .from('resources')
    .upsert(row)
    .select('id, topic_id, data')
    .single();

  if (error) {
    console.error('Failed to upsert resource:', error.message);
    throw new Error(error.message);
  }

  return rowToResource(data as DbResourceRow);
}

export async function deleteResource(resourceId: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', resourceId);

  if (error) {
    console.error('Failed to delete resource:', error.message);
    throw new Error(error.message);
  }
}

export async function seedResourcesIfEmpty(resources: ResourceItem[]): Promise<void> {
  if (!isSupabaseConfigured || resources.length === 0) return;

  const { count, error: countError } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Failed to check resource count:', countError.message);
    return;
  }

  if (count && count > 0) return;

  const rows = resources.map(resourceToRow);
  const { error } = await supabase.from('resources').insert(rows);

  if (error) {
    console.error('Failed to seed resources:', error.message);
  }
}
