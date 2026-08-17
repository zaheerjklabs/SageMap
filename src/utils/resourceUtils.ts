import { RoadmapTopic, ResourceItem, UserCollections } from '../types';

/**
 * Resolves a single topic's resources by:
 * 1. Prepending custom resources for this topic
 * 2. Combining with base resources
 * 3. Applying user edits from `editedResources`
 * 4. Filtering out deleted resources from `deletedResourceIds`
 */
export function resolveTopicResources(
  topic: RoadmapTopic,
  collections: UserCollections
): RoadmapTopic {
  const { customResources = [], editedResources = {}, deletedResourceIds = {} } = collections;

  // Custom resources for this specific topic
  const customForTopic = customResources.filter((r) => r.topicId === topic.id);

  // Combine custom resources with default topic resources
  const combined = [...customForTopic, ...topic.resources];

  // Apply edits and filter deletions
  const resolvedResources: ResourceItem[] = [];

  for (const res of combined) {
    if (deletedResourceIds[res.id]) {
      // Skip deleted
      continue;
    }

    const edited = editedResources[res.id];
    if (edited) {
      resolvedResources.push({
        ...edited,
        isEdited: true
      });
    } else {
      resolvedResources.push(res);
    }
  }

  return {
    ...topic,
    resources: resolvedResources
  };
}

/**
 * Resolves all topics and their resources based on current user collections state.
 */
export function resolveAllTopics(
  topics: RoadmapTopic[],
  collections: UserCollections
): RoadmapTopic[] {
  return topics.map((t) => resolveTopicResources(t, collections));
}

/**
 * Merges Supabase-managed resources into static roadmap topics.
 * When Supabase has resources stored, the Supabase database is the single source of truth,
 * guaranteeing that additions, edits, and deletions are permanent and visible to all users.
 */
export function mergeTopicsWithDbResources(
  topics: RoadmapTopic[],
  dbResources: ResourceItem[]
): RoadmapTopic[] {
  if (!dbResources || dbResources.length === 0) {
    return topics;
  }

  // Group active DB resources by topic ID
  const dbByTopic = new Map<number, ResourceItem[]>();

  for (const res of dbResources) {
    if ((res as any).isDeleted || (res as any).deleted) {
      continue;
    }
    const list = dbByTopic.get(res.topicId) || [];
    list.push(res);
    dbByTopic.set(res.topicId, list);
  }

  return topics.map((topic) => {
    // If Supabase has an entry or list for this topic, use the live DB list
    if (dbByTopic.has(topic.id)) {
      const dbForTopic = dbByTopic.get(topic.id) || [];
      return {
        ...topic,
        resources: dbForTopic
      };
    }

    // If DB is populated overall (seeded) but has 0 items for this specific topic,
    // it means all items for this topic were deleted in DB
    if (dbResources.length >= 10) {
      return {
        ...topic,
        resources: []
      };
    }

    // Fallback to static topic resources if DB is completely unseeded
    return topic;
  });
}

/**
 * Resolves all resources across all topics with metadata for cataloging/filtering.
 */
export function resolveAllCatalogResources(
  topics: RoadmapTopic[],
  collections: UserCollections
) {
  const resolvedTopics = resolveAllTopics(topics, collections);
  return resolvedTopics.flatMap((topic) =>
    topic.resources.map((res) => ({
      ...res,
      topicNumber: topic.stepNumber,
      topicTitle: topic.title,
      topicCategory: topic.categoryLabel
    }))
  );
}
