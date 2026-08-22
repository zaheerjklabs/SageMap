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
 * Merges Supabase-managed resources into roadmap topics.
 * When Supabase is initialized, the Supabase database is the permanent single source of truth.
 * Additions, edits, and deletions are strictly respected and static resources are never resurrected.
 */
export function mergeTopicsWithDbResources(
  topics: RoadmapTopic[],
  dbResources: ResourceItem[],
  isDbInitialized: boolean = true,
  deletedResourceIds: Set<string> | Record<string, boolean> = new Set()
): RoadmapTopic[] {
  const isDeletedId = (id: string): boolean => {
    if (deletedResourceIds instanceof Set) {
      return deletedResourceIds.has(id);
    }
    return Boolean(deletedResourceIds[id]);
  };

  // Map of active DB resources by resource ID
  const dbById = new Map<string, ResourceItem>();
  for (const res of dbResources) {
    if ((res as any).isDeleted || (res as any).deleted) {
      continue;
    }
    dbById.set(res.id, res);
  }

  // Set of all static resource IDs across all default roadmap topics
  const staticResourceIds = new Set(topics.flatMap((t) => t.resources.map((r) => r.id)));

  // Group custom (non-static) DB resources by topicId
  const customDbByTopic = new Map<number, ResourceItem[]>();
  for (const res of dbResources) {
    if ((res as any).isDeleted || (res as any).deleted) {
      continue;
    }
    if (!staticResourceIds.has(res.id)) {
      const list = customDbByTopic.get(res.topicId) || [];
      list.push(res);
      customDbByTopic.set(res.topicId, list);
    }
  }

  return topics.map((topic) => {
    // 1. Process static resources for this topic:
    //    If DB row exists, use DB row (edited version).
    //    If DB row does not exist, check if static resource was deleted via tombstone list.
    const resolvedStatic: ResourceItem[] = [];
    for (const staticRes of topic.resources) {
      const fromDb = dbById.get(staticRes.id);
      if (fromDb) {
        resolvedStatic.push({ ...fromDb, isEdited: true });
      } else if (!isDeletedId(staticRes.id)) {
        resolvedStatic.push(staticRes);
      }
    }

    // 2. Append all custom resources added via DB for this topic
    const customForTopic = customDbByTopic.get(topic.id) || [];
    const allTopicResources = [...resolvedStatic, ...customForTopic];

    return {
      ...topic,
      resources: allTopicResources
    };
  });
}

/**
 * Sorts resources based on custom admin resourceOrder array of resource IDs.
 * Resources present in resourceOrder maintain their specified rank, while unlisted ones appear after.
 */
export function sortResourcesByOrder<T extends ResourceItem>(
  resources: T[],
  resourceOrder: string[] = []
): T[] {
  if (!resourceOrder || resourceOrder.length === 0) {
    return resources;
  }

  const orderMap = new Map<string, number>();
  resourceOrder.forEach((id, index) => {
    orderMap.set(id, index);
  });

  return [...resources].sort((a, b) => {
    const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : Number.MAX_SAFE_INTEGER;
    const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return 0;
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
  const catalog = resolvedTopics.flatMap((topic) =>
    topic.resources.map((res) => ({
      ...res,
      topicNumber: topic.stepNumber,
      topicTitle: topic.title,
      topicCategory: topic.categoryLabel
    }))
  );
  return sortResourcesByOrder(catalog, collections.resourceOrder);
}
