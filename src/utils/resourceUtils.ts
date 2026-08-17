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

  if (isDbInitialized) {
    // Group active DB resources by topic ID
    const dbByTopic = new Map<number, ResourceItem[]>();

    for (const res of dbResources) {
      if ((res as any).isDeleted || (res as any).deleted || isDeletedId(res.id)) {
        continue;
      }
      const list = dbByTopic.get(res.topicId) || [];
      list.push(res);
      dbByTopic.set(res.topicId, list);
    }

    return topics.map((topic) => {
      const topicResources = dbByTopic.get(topic.id) || [];
      return {
        ...topic,
        resources: topicResources
      };
    });
  }

  // Fallback ONLY when Supabase is completely unconfigured / uninitialized (offline / demo mode):
  return topics.map((topic) => {
    const activeStatic = topic.resources.filter((res) => !isDeletedId(res.id));
    return {
      ...topic,
      resources: activeStatic
    };
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
